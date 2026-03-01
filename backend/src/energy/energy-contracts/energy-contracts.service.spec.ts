import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { EnergyContractService } from './energy-contracts.service';
import { EnergyContract, ContractStatus } from './energy-contracts.entity';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';
import { EnergyOffer, EnergyOfferStatus } from 'energy/energy-offer/energy-offer.entity';
import { Wallet } from 'finance/wallet/wallet.entity';
import { IEnergyContractBlockchain, ENERGY_CONTRACT_BLOCKCHAIN_PORT } from 'infrastructure/blockchain/ports/energy-contracts-blockchain.port';
import { FinanceHelperService } from 'infrastructure/finance/finance-helper.service';

/**
 * EnergyContractService — Tests unitarios
 *
 * Foco: lógica de negocio crítica
 *   - cancelContract: validaciones de pertenencia, estado y actor
 *   - findContractById: seguridad — solo buyer/seller pueden ver el contrato
 *
 * contractOffer usa DataSource.transaction internamente — se testea
 * el happy path y los casos de fallo del bloque blockchain.
 */
describe('EnergyContractService', () => {
  let service: EnergyContractService;
  let contractRepo: any;
  let consumptionRepo: any;
  let blockchainService: jest.Mocked<IEnergyContractBlockchain>;
  let dataSource: any;

  // ─── Fixtures ─────────────────────────────────────────────────────────────

  const buyerUser  = { id: 'buyer-user-id' };
  const sellerUser = { id: 'seller-user-id' };
  const otherUser  = { id: 'other-user-id' };

  const buyerWallet:  Partial<Wallet> = { id: 'buyer-wallet-id',  address: '0xBUYER',  user: buyerUser  as any };
  const sellerWallet: Partial<Wallet> = { id: 'seller-wallet-id', address: '0xSELLER', user: sellerUser as any };

  const activeContract: Partial<EnergyContract> = {
    id: 'contract-uuid-123',
    status: ContractStatus.ACTIVE,
    isActive: true,
    contractAddress: '0xCONTRACT',
    pricePerKwhCop: '500',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    buyerWallet: buyerWallet as Wallet,
    sellerWallet: sellerWallet as Wallet,
  };

  beforeEach(async () => {
    contractRepo = { findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
    consumptionRepo = { find: jest.fn() };

    // DataSource mock — simula transaction() ejecutando el callback con un manager mock
    const manager = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation(cb => cb(manager)),
      manager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyContractService,
        { provide: DataSource,                         useValue: dataSource },
        { provide: ENERGY_CONTRACT_BLOCKCHAIN_PORT,    useValue: { deployEnergyContract: jest.fn(), activateContract: jest.fn(), cancelContract: jest.fn() } },
        { provide: FinanceHelperService,               useValue: {} },
        { provide: getRepositoryToken(EnergyContract), useValue: contractRepo },
        { provide: getRepositoryToken(EnergyConsumption), useValue: consumptionRepo },
      ],
    }).compile();

    service           = module.get<EnergyContractService>(EnergyContractService);
    blockchainService = module.get(ENERGY_CONTRACT_BLOCKCHAIN_PORT);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findContractById ──────────────────────────────────────────────────────

  describe('findContractById', () => {
    it('retorna el contrato si el userId es el comprador', async () => {
      contractRepo.findOne.mockResolvedValue(activeContract);

      const result = await service.findContractById('contract-uuid-123', buyerUser.id);

      expect(result).toBe(activeContract);
    });

    it('retorna el contrato si el userId es el vendedor', async () => {
      contractRepo.findOne.mockResolvedValue(activeContract);

      const result = await service.findContractById('contract-uuid-123', sellerUser.id);

      expect(result).toBe(activeContract);
    });

    it('retorna null si el contrato no existe', async () => {
      contractRepo.findOne.mockResolvedValue(null);

      const result = await service.findContractById('no-existe', buyerUser.id);

      expect(result).toBeNull();
    });

    it('retorna null si el userId no pertenece al contrato (seguridad)', async () => {
      contractRepo.findOne.mockResolvedValue(activeContract);

      const result = await service.findContractById('contract-uuid-123', otherUser.id);

      expect(result).toBeNull();
    });
  });

  // ─── cancelContract ────────────────────────────────────────────────────────

  describe('cancelContract', () => {
    it('cancela como CANCELED_BY_BUYER cuando lo cancela el comprador', async () => {
      contractRepo.findOne
        .mockResolvedValueOnce(activeContract)  // primera llamada
        .mockResolvedValueOnce({ ...activeContract, status: ContractStatus.CANCELED_BY_BUYER }); // después de update
      (blockchainService.cancelContract as jest.Mock).mockResolvedValue('0xTX');
      contractRepo.update.mockResolvedValue({});

      const result = await service.cancelContract('contract-uuid-123', buyerUser.id);

      expect(blockchainService.cancelContract).toHaveBeenCalledWith(
        activeContract.contractAddress,
        'cancelación voluntaria',
      );
      expect(contractRepo.update).toHaveBeenCalledWith(
        { id: activeContract.id },
        expect.objectContaining({ status: ContractStatus.CANCELED_BY_BUYER }),
      );
      expect(result.status).toBe(ContractStatus.CANCELED_BY_BUYER);
    });

    it('cancela como CANCELED_BY_SELLER cuando lo cancela el vendedor', async () => {
      contractRepo.findOne
        .mockResolvedValueOnce(activeContract)
        .mockResolvedValueOnce({ ...activeContract, status: ContractStatus.CANCELED_BY_SELLER });
      (blockchainService.cancelContract as jest.Mock).mockResolvedValue('0xTX');
      contractRepo.update.mockResolvedValue({});

      await service.cancelContract('contract-uuid-123', sellerUser.id);

      expect(contractRepo.update).toHaveBeenCalledWith(
        { id: activeContract.id },
        expect.objectContaining({ status: ContractStatus.CANCELED_BY_SELLER }),
      );
    });

    it('lanza BadRequestException si el contrato no existe', async () => {
      contractRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelContract('no-existe', buyerUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el usuario no pertenece al contrato', async () => {
      contractRepo.findOne.mockResolvedValue(activeContract);

      await expect(
        service.cancelContract('contract-uuid-123', otherUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el contrato no está ACTIVE', async () => {
      const inactiveContract = { ...activeContract, status: ContractStatus.CANCELED_BY_BUYER };
      contractRepo.findOne.mockResolvedValue(inactiveContract);

      await expect(
        service.cancelContract('contract-uuid-123', buyerUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el contrato no tiene contractAddress', async () => {
      const noAddressContract = { ...activeContract, contractAddress: null };
      contractRepo.findOne.mockResolvedValue(noAddressContract);

      await expect(
        service.cancelContract('contract-uuid-123', buyerUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza InternalServerErrorException si blockchain falla', async () => {
      contractRepo.findOne.mockResolvedValue(activeContract);
      (blockchainService.cancelContract as jest.Mock).mockRejectedValue(
        new Error('blockchain timeout'),
      );

      await expect(
        service.cancelContract('contract-uuid-123', buyerUser.id),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('no llama a blockchain si el contrato no pasa las validaciones previas', async () => {
      contractRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelContract('no-existe', buyerUser.id),
      ).rejects.toThrow();

      expect(blockchainService.cancelContract).not.toHaveBeenCalled();
    });
  });
});
