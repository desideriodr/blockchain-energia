import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { EnergyConsumptionService, ConsumptionAction } from './energy-consumption.service';
import { EnergyContract, ContractStatus } from 'energy/energy-contracts/energy-contracts.entity';
import { EnergyConsumption } from './energy-consumption.entity';
import { BlockchainSyncStatus } from './graphql/dto/energy-consumption.enums';
import { ENERGY_CONTRACT_BLOCKCHAIN_PORT } from 'infrastructure/blockchain/ports/energy-contracts-blockchain.port';
import { WalletTransactionService } from 'finance/wallet-transactions/wallet-transactions.service';

/**
 * EnergyConsumptionService — Tests unitarios
 *
 * Foco: lógica crítica de reportConsumption
 *   - REPORT: happy path — balances actualizados, consumo creado PENDING → SYNCED
 *   - TERMINATE_EXPIRED: contrato vencido → estado TERMINATED en DB + blockchain
 *   - SUSPEND_NO_PRODUCTION: energyStored del vendedor insuficiente
 *   - SUSPEND_NO_FUNDS: balance del comprador insuficiente
 *   - Contrato inactivo: retorna null sin modificar nada
 */
describe('EnergyConsumptionService', () => {
  let service: EnergyConsumptionService;
  let blockchainService: any;
  let walletTxService: any;
  let dataSource: any;
  let manager: any;

  // ─── Fixtures ──────────────────────────────────────────────────────────────

  const makeBuyerWallet  = () => ({ id: 'buyer-w',  address: '0xBUYER',  balanceCop: '100000', energyStored: '0' });
  const makeSellerWallet = () => ({ id: 'seller-w', address: '0xSELLER', balanceCop: '0',      energyStored: '500' });

  const makeContract = (overrides: Partial<EnergyContract> = {}): EnergyContract => ({
    id: 'contract-id',
    contractAddress: '0xCONTRACT',
    pricePerKwhCop: '200',
    status: ContractStatus.ACTIVE,
    isActive: true,
    startDate: new Date(Date.now() - 86400000),
    endDate:   new Date(Date.now() + 86400000 * 30),
    buyerWallet:  makeBuyerWallet()  as any,
    sellerWallet: makeSellerWallet() as any,
    ...overrides,
  } as EnergyContract);

  const makeConsumption = (): EnergyConsumption => ({
    id: 'consumption-id',
    energyKwhConsumed: '1',
    costCop: '200',
    blockchainSyncStatus: BlockchainSyncStatus.PENDING,
  } as EnergyConsumption);

  // ─── Setup ─────────────────────────────────────────────────────────────────

  beforeEach(async () => {
    const consumption = makeConsumption();

    manager = {
      findOne: jest.fn(),
      // save devuelve el mismo objeto que recibe (TypeORM behavior)
      // cuando recibe el consumption creado por create(), lo retorna con su id intacto
      save: jest.fn().mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        // Si es el consumption (tiene blockchainSyncStatus), aseguramos que retorna con id
        if (entity?.blockchainSyncStatus !== undefined) return Promise.resolve(consumption);
        return Promise.resolve(entity);
      }),
      create: jest.fn().mockReturnValue(consumption),
    };

    // DataSource: transaction() ejecuta el callback con el manager mock
    // getRepository() devuelve un repo con update() para los updates post-transacción
    const consumptionRepo = { update: jest.fn().mockResolvedValue({}), findOne: jest.fn() };
    const contractRepo    = { findOne: jest.fn() };

    dataSource = {
      transaction: jest.fn().mockImplementation(cb => cb(manager)),
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === EnergyConsumption) return consumptionRepo;
        if (entity === EnergyContract)    return contractRepo;
        return {};
      }),
    };

    blockchainService = {
      reportConsumption:    jest.fn().mockResolvedValue('0xTX'),
      suspendContract:      jest.fn().mockResolvedValue('0xTX'),
      terminateByExpiration: jest.fn().mockResolvedValue('0xTX'),
      burnREC:              jest.fn().mockResolvedValue('0xTX'),
    };

    walletTxService = {
      recordConsumptionTransaction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyConsumptionService,
        { provide: DataSource,                      useValue: dataSource },
        { provide: ENERGY_CONTRACT_BLOCKCHAIN_PORT, useValue: blockchainService },
        { provide: WalletTransactionService,        useValue: walletTxService },
      ],
    }).compile();

    service = module.get<EnergyConsumptionService>(EnergyConsumptionService);
  });

  beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterAll(() => (console.error as jest.Mock).mockRestore());
  afterEach(() => jest.clearAllMocks());

  // ─── Contrato inexistente ───────────────────────────────────────────────────

  describe('cuando el contrato no existe', () => {
    it('retorna null sin llamar a blockchain', async () => {
      manager.findOne.mockResolvedValueOnce(null);

      const result = await service.reportConsumption('no-existe', 1);

      expect(result).toBeNull();
      expect(blockchainService.reportConsumption).not.toHaveBeenCalled();
    });
  });

  // ─── Contrato inactivo ──────────────────────────────────────────────────────

  describe('cuando el contrato no está ACTIVE', () => {
    it('retorna null sin modificar balances ni blockchain', async () => {
      const contract = makeContract({ status: ContractStatus.SUSPENDED_INSUFFICIENT_FUNDS });
      manager.findOne
        .mockResolvedValueOnce(contract)   // primer findOne con lock
        .mockResolvedValueOnce(contract);  // segundo findOne con relaciones

      const result = await service.reportConsumption('contract-id', 1);

      expect(result).toBeNull();
      expect(manager.save).not.toHaveBeenCalled();
      expect(blockchainService.reportConsumption).not.toHaveBeenCalled();
    });
  });

  // ─── TERMINATE_EXPIRED ─────────────────────────────────────────────────────

  describe('cuando el contrato está vencido', () => {
    it('cambia estado a TERMINATED_TERMS_EXPIRED y llama terminateByExpiration', async () => {
      const expired = makeContract({
        endDate: new Date(Date.now() - 1000), // venció hace 1 segundo
      });
      manager.findOne
        .mockResolvedValueOnce(expired)
        .mockResolvedValueOnce(expired);

      const result = await service.reportConsumption('contract-id', 1);

      expect(result).toEqual({ action: ConsumptionAction.TERMINATE_EXPIRED });
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContractStatus.TERMINATED_TERMS_EXPIRED, isActive: false })
      );
      expect(blockchainService.terminateByExpiration).toHaveBeenCalledWith('0xCONTRACT');
      expect(blockchainService.reportConsumption).not.toHaveBeenCalled();
    });
  });

  // ─── SUSPEND_NO_PRODUCTION ─────────────────────────────────────────────────

  describe('cuando el vendedor no tiene energía suficiente', () => {
    it('suspende el contrato y llama suspendContract', async () => {
      const sellerWithoutEnergy = { ...makeSellerWallet(), energyStored: '0.001' };
      const contract = makeContract({ sellerWallet: sellerWithoutEnergy as any });

      manager.findOne
        .mockResolvedValueOnce(contract)
        .mockResolvedValueOnce(contract);

      const result = await service.reportConsumption('contract-id', 1); // consume 1 kWh, solo hay 0.001

      expect(result).toEqual({ action: ConsumptionAction.SUSPEND_NO_PRODUCTION });
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContractStatus.SUSPENDED_NO_PRODUCTION, isActive: false })
      );
      expect(blockchainService.suspendContract).toHaveBeenCalledWith(
        '0xCONTRACT',
        'Suspendido: No hay producción suficiente',
      );
    });
  });

  // ─── SUSPEND_NO_FUNDS ──────────────────────────────────────────────────────

  describe('cuando el comprador no tiene fondos suficientes', () => {
    it('suspende el contrato y llama suspendContract', async () => {
      const poorBuyer = { ...makeBuyerWallet(), balanceCop: '1' }; // solo $1, necesita $200 (1 kWh * $200)
      const contract = makeContract({ buyerWallet: poorBuyer as any });

      manager.findOne
        .mockResolvedValueOnce(contract)
        .mockResolvedValueOnce(contract);

      const result = await service.reportConsumption('contract-id', 1);

      expect(result).toEqual({ action: ConsumptionAction.SUSPEND_NO_FUNDS });
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContractStatus.SUSPENDED_INSUFFICIENT_FUNDS, isActive: false })
      );
      expect(blockchainService.suspendContract).toHaveBeenCalledWith(
        '0xCONTRACT',
        'Suspendido: Fondos insuficientes',
      );
    });
  });

  // ─── REPORT happy path ─────────────────────────────────────────────────────

  describe('happy path — reporte exitoso', () => {
    let contract: EnergyContract;

    beforeEach(() => {
      contract = makeContract();
      manager.findOne
        .mockResolvedValueOnce(contract)
        .mockResolvedValueOnce(contract);
    });

    it('retorna action REPORT con el consumo creado', async () => {
      const result = await service.reportConsumption('contract-id', 1);

      expect(result).toMatchObject({ action: ConsumptionAction.REPORT });
      expect(result).toHaveProperty('consumption');
    });

    it('descuenta el balance del comprador correctamente (1 kWh * $200 = $200)', async () => {
      await service.reportConsumption('contract-id', 1);

      expect(manager.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'buyer-w', balanceCop: '99800' }),  // 100000 - 200
        ])
      );
    });

    it('acredita el balance del vendedor con el neto (98% de $200 = $196)', async () => {
      await service.reportConsumption('contract-id', 1);

      expect(manager.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'seller-w', balanceCop: '196' }),   // 0 + 196
        ])
      );
    });

    it('descuenta energyStored del vendedor', async () => {
      await service.reportConsumption('contract-id', 1);

      expect(manager.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'seller-w', energyStored: '499' }), // 500 - 1
        ])
      );
    });

    it('crea el consumo con status PENDING y luego lo marca SYNCED', async () => {
      await service.reportConsumption('contract-id', 1);

      expect(manager.create).toHaveBeenCalledWith(
        EnergyConsumption,
        expect.objectContaining({ blockchainSyncStatus: BlockchainSyncStatus.PENDING }),
      );

      const consumptionRepo = dataSource.getRepository(EnergyConsumption);
      expect(consumptionRepo.update).toHaveBeenCalledWith(
        'consumption-id',
        { blockchainSyncStatus: BlockchainSyncStatus.SYNCED },
      );
    });

    it('llama a reportConsumption y burnREC en blockchain', async () => {
      // burnREC necesita cargar el contrato con sellerWallet
      const contractRepo = dataSource.getRepository(EnergyContract);
      contractRepo.findOne.mockResolvedValue({
        contractAddress: '0xCONTRACT',
        sellerWallet: { address: '0xSELLER' },
      });

      await service.reportConsumption('contract-id', 1);

      expect(blockchainService.reportConsumption).toHaveBeenCalledWith('0xCONTRACT', '1');
      expect(blockchainService.burnREC).toHaveBeenCalledWith('0xSELLER', '0xCONTRACT', '1');
    });

    it('registra la transacción de wallet', async () => {
      await service.reportConsumption('contract-id', 1);

      expect(walletTxService.recordConsumptionTransaction).toHaveBeenCalled();
    });
  });

  // ─── Fallo de blockchain ───────────────────────────────────────────────────

  describe('cuando blockchain falla en el reporte', () => {
    it('marca el consumo como FAILED sin lanzar excepción', async () => {
      const contract = makeContract();
      manager.findOne
        .mockResolvedValueOnce(contract)
        .mockResolvedValueOnce(contract);

      blockchainService.reportConsumption.mockRejectedValue(new Error('RPC timeout'));

      const result = await service.reportConsumption('contract-id', 1);

      // El resultado sigue siendo REPORT (la DB ya se confirmó)
      expect(result).toMatchObject({ action: ConsumptionAction.REPORT });

      const consumptionRepo = dataSource.getRepository(EnergyConsumption);
      expect(consumptionRepo.update).toHaveBeenCalledWith(
        'consumption-id',
        { blockchainSyncStatus: BlockchainSyncStatus.FAILED },
      );
    });
  });
});
