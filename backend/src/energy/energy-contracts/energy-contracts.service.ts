import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Decimal } from 'decimal.js';

import {
  EnergyOffer,
  EnergyOfferStatus,
} from '../energy-offer/energy-offer.entity';
import {
  EnergyContract,
  ContractStatus,
} from './energy-contracts.entity';
import { Wallet } from '../../finance/wallet/wallet.entity';
import { BlockchainService } from 'infrastructure/blockchain/blockchain.service';
import { FinanceHelperService } from 'infrastructure/finance/finance-helper.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';

@Injectable()
export class EnergyContractService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly blockchainService: BlockchainService,
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
    // 1️⃣ TRANSACCIÓN DB
    // ===============================
    const contract = await this.dataSource.transaction(async manager => {
      const offer = await manager.findOne(EnergyOffer, {
        where: { id: offerId },
        lock: { mode: 'pessimistic_write' }, // bloquea la oferta
      });

      if (!offer || offer.status !== EnergyOfferStatus.OPEN) {
        throw new BadRequestException('Oferta no disponible');
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

      // 🔹 Buscar contrato previo del mismo buyer + oferta
      let contract = await manager.findOne(EnergyContract, {
        where: { offerId: offer.id, buyerWallet: { id: buyerWallet.id } },
        relations: ['buyerWallet', 'sellerWallet'],
      });

      const now = new Date();
      const startDate = now;
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      if (contract) {
        // 🔹 Reactivar contrato existente si estaba inactivo o fallido
        contract.isActive = true;
        contract.status = ContractStatus.PENDING_BLOCKCHAIN;
        contract.startDate = startDate;
        contract.endDate = endDate;

        // 🔹 Guardar inmediatamente antes de blockchain
        await manager.save(contract);
      } else {
        // 🔹 Crear contrato nuevo
        contract = manager.create(EnergyContract, {
          offerId: offer.id,
          sellerWallet,
          buyerWallet,
          pricePerKwhCop: offer.pricePerKwhCop,
          startDate,
          endDate,
          status: ContractStatus.PENDING_BLOCKCHAIN,
          isActive: true,
        });

        await manager.save(contract);
      }

      // 🔹 Devolver el contrato con relaciones
      return this.findContractWithRelations(manager, contract.id);
    });

    // ===============================
    // 2️⃣ BLOCKCHAIN
    // ===============================
    try {
      const deployedAddress = await this.blockchainService.deployEnergyContract(
        contract.buyerWallet.address,
        contract.sellerWallet.address,
        contract.pricePerKwhCop,
        Math.floor(contract.startDate.getTime() / 1000),
        Math.floor(contract.endDate.getTime() / 1000),
      );

      await this.blockchainService.activateContract(deployedAddress);

      // 🔹 Actualizar estado DB solo después de confirmar blockchain
      contract.contractAddress = deployedAddress;
      contract.status = ContractStatus.ACTIVE;
      contract.isActive = true;

      await this.contractRepo.save(contract);

      return contract;

    } catch (error) {
      // 🔹 En caso de fallo blockchain, marcar como FAILED
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

    // 1️⃣ Buscar contrato con relaciones
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

    // 2️⃣ Validar pertenencia
    const isBuyer = contract.buyerWallet.user.id === userId;
    const isSeller = contract.sellerWallet.user.id === userId;

    if (!isBuyer && !isSeller) {
      throw new BadRequestException('No autorizado');
    }

    // 3️⃣ Validar estado
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

    // 4️⃣ Determinar nuevo estado según actor
    const newStatus = isBuyer
      ? ContractStatus.CANCELED_BY_BUYER
      : ContractStatus.CANCELED_BY_SELLER;

    try {
      // 5️⃣ Cancelar en blockchain
      await this.blockchainService.cancelContract(
        contract.contractAddress,
        'cancelación voluntaria'
      );

      // 6️⃣ Actualizar BD
      await this.contractRepo.update(
        { id: contract.id },
        {
          status: newStatus,
          isActive: false,
        },
      );

      // 7️⃣ Reconsultar contrato actualizado
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
