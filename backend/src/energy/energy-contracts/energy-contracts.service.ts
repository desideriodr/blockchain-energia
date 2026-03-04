import {Injectable, BadRequestException, InternalServerErrorException, Inject} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IEnergyContractBlockchain, ENERGY_CONTRACT_BLOCKCHAIN_PORT } from 'infrastructure/blockchain/ports/energy-contracts-blockchain.port';

import { EnergyOffer, EnergyOfferStatus } from '../energy-offer/energy-offer.entity';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';
import { EnergyContract, ContractStatus } from './energy-contracts.entity';
import { Wallet } from '../../finance/wallet/wallet.entity';

import { FinanceHelperService } from 'infrastructure/finance/finance-helper.service';



@Injectable()
export class EnergyContractService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(ENERGY_CONTRACT_BLOCKCHAIN_PORT)
    private readonly blockchainService: IEnergyContractBlockchain,
    private readonly financeHelper: FinanceHelperService,
    @InjectRepository(EnergyContract)
    private readonly contractRepo: Repository<EnergyContract>,
    @InjectRepository(EnergyConsumption)
    private readonly consumptionRepo: Repository<EnergyConsumption>,
  ) { }

  async findContractsByUser(userId: string): Promise<EnergyContract[]> {
    return this.contractRepo.find({
      where: [
        { buyerWallet: { user: { id: userId } } },
        { sellerWallet: { user: { id: userId } } },
      ],
      relations: [
        'sellerWallet',
        'sellerWallet.user',
        'buyerWallet',
        'buyerWallet.user',
      ],
      order: {
        startDate: 'DESC',
      },
    });
  }

  async findContractById(
    contractId: string,
    userId: string,
  ): Promise<EnergyContract | null> {

    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: [
        'sellerWallet',
        'sellerWallet.user',
        'buyerWallet',
        'buyerWallet.user',
        'consumptions',
      ],
    });

    if (!contract) {
      return null;
    }

    // Seguridad: validar que el usuario pertenezca al contrato
    const isBuyer = contract.buyerWallet.user.id === userId;
    const isSeller = contract.sellerWallet.user.id === userId;

    if (!isBuyer && !isSeller) {
      return null;
    }

    return contract;
  }

  async findConsumptionsByContract(contractId: string, userId: string) {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['buyerWallet.user', 'sellerWallet.user'],
    });

    if (!contract) return [];

    const isBuyer = contract.buyerWallet.user.id === userId;
    const isSeller = contract.sellerWallet.user.id === userId;

    if (!isBuyer && !isSeller) {
      return [];
    }

    return this.consumptionRepo.find({
      where: { contract: { id: contractId } },
      order: { recordedAt: 'DESC' },
    });
  }

  private async findContractWithRelations(
    manager: EntityManager,
    id: string,
  ): Promise<EnergyContract> {
    const contract = await manager.findOne(EnergyContract, {
      where: { id },
      relations: [
        'sellerWallet',
        'sellerWallet.user',
        'buyerWallet',
        'buyerWallet.user',
      ],
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  async contractOffer(userId: string, offerId: string): Promise<EnergyContract> {
    // ===============================
    // TRANSACCIÓN DB - las transacciones se registran primero en db y se confirma para asegurar integridad entre db y blockchain
    // ===============================
    const contract = await this.dataSource.transaction(async manager => {
      // Paso 1: bloquear la oferta (sin relaciones para evitar LEFT JOIN + FOR UPDATE)
      const offer = await manager.findOne(EnergyOffer, {
        where: { id: offerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!offer || offer.status !== EnergyOfferStatus.OPEN) {
        throw new BadRequestException('Oferta no disponible');
      }

      // Paso 2: cargar energySource por separado (ya sin lock)
      const offerWithSource = await manager.findOne(EnergyOffer, {
        where: { id: offerId },
        relations: ['energySource'],
      });

      if (!offerWithSource?.energySource) {
        throw new BadRequestException('La oferta no tiene fuente de energía asociada');
      }

      const sellerWallet = await manager.findOneOrFail(Wallet, {
        where: { address: offer.sellerAddress },
      });

      const buyerWallet = await manager.findOneOrFail(Wallet, {
        where: { user: { id: userId } },
      });

      if (buyerWallet.id === sellerWallet.id) {
        throw new BadRequestException('No puedes contratar tu propia oferta');
      }

      // Buscar contrato previo del mismo buyer + oferta
      let contract = await manager.findOne(EnergyContract, {
        where: { offerId: offer.id, buyerWallet: { id: buyerWallet.id } },
        relations: ['buyerWallet', 'sellerWallet'],
      });

      const now = new Date();
      const startDate = now;
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const sourceType = offerWithSource.energySource.sourceType;

      if (contract) {
        // Reactivar contrato existente si estaba inactivo o fallido
        contract.isActive = true;
        contract.status = ContractStatus.PENDING_BLOCKCHAIN;
        contract.startDate = startDate;
        contract.endDate = endDate;
        contract.sourceType = sourceType;

        // Guardar inmediatamente antes de blockchain
        await manager.save(contract);
      } else {
        // Crear contrato nuevo
        contract = manager.create(EnergyContract, {
          offerId: offer.id,
          sellerWallet,
          buyerWallet,
          pricePerKwhCop: offer.pricePerKwhCop,
          sourceType,
          startDate,
          endDate,
          status: ContractStatus.PENDING_BLOCKCHAIN,
          isActive: true,
        });

        await manager.save(contract);
      }

      // Devolver el contrato con relaciones
      return this.findContractWithRelations(manager, contract.id);
    });

    // BLOCKCHAIN - registrado el contrato en BD se realiza el despligue
    try {
      const deployedAddress = await this.blockchainService.deployEnergyContract(
        contract.buyerWallet.address,
        contract.sellerWallet.address,
        contract.pricePerKwhCop,
        Math.floor(contract.startDate.getTime() / 1000),
        Math.floor(contract.endDate.getTime() / 1000),
        contract.sourceType,
      );

      await this.blockchainService.activateContract(deployedAddress);

      // Actualizar estado DB solo después de confirmar blockchain
      contract.contractAddress = deployedAddress;
      contract.status = ContractStatus.ACTIVE;
      contract.isActive = true;

      await this.contractRepo.save(contract);

      return contract;

    } catch (error) {
      // En caso de fallo blockchain, marcar como FAILED
      contract.status = ContractStatus.FAILED;
      contract.isActive = false;
      await this.contractRepo.save(contract);

      throw new InternalServerErrorException(
        'Contrato creado en DB pero falló registro en blockchain',
      );
    }
  }

  // cancelacion voluntaria de contrato
  async cancelContract(
    contractId: string,
    userId: string,
  ): Promise<EnergyContract> {

    // Paso 1. Buscar contrato con relaciones
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: [
        'buyerWallet',
        'buyerWallet.user',
        'sellerWallet',
        'sellerWallet.user',
      ],
    });

    if (!contract) {
      throw new BadRequestException('Contrato no encontrado');
    }

    // Paso 2. Validar pertenencia
    const isBuyer = contract.buyerWallet.user.id === userId;
    const isSeller = contract.sellerWallet.user.id === userId;

    if (!isBuyer && !isSeller) {
      throw new BadRequestException('No autorizado');
    }

    // Paso 3. Validar estado
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(
        'Solo contratos activos pueden cancelarse',
      );
    }

    if (!contract.contractAddress) {
      throw new BadRequestException(
        'Contrato no tiene dirección blockchain',
      );
    }

    // Paso 4. Determinar nuevo estado según actor
    const newStatus = isBuyer
      ? ContractStatus.CANCELED_BY_BUYER
      : ContractStatus.CANCELED_BY_SELLER;

    try {
      // Paso 5. Cancelar en blockchain
      await this.blockchainService.cancelContract(
        contract.contractAddress,
        'cancelación voluntaria'
      );

      // Paso 6. Actualizar BD
      await this.contractRepo.update(
        { id: contract.id },
        {
          status: newStatus,
          isActive: false,
        },
      );

      // Paso 7. Reconsultar contrato actualizado
      const updatedContract = await this.contractRepo.findOne({
        where: { id: contract.id },
        relations: [
          'buyerWallet',
          'buyerWallet.user',
          'sellerWallet',
          'sellerWallet.user',
        ],
      });

      if (!updatedContract) {
        throw new InternalServerErrorException(
          'Contrato no encontrado después de actualizar',
        );
      }

      return updatedContract;

    } catch (error: any) {
      console.error('Blockchain cancel error:', error);

      throw new InternalServerErrorException(
        error?.reason ||
        error?.message ||
        'Falló cancelación en blockchain',
      );
    }
  }
}
