import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IEnergyContractBlockchain, ENERGY_CONTRACT_BLOCKCHAIN_PORT } from 'infrastructure/blockchain/ports/energy-contracts-blockchain.port';

import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Cron } from '@nestjs/schedule';

import { ContractStatus, EnergyContract } from 'energy/energy-contracts/energy-contracts.entity';
import { EnergyConsumption } from './energy-consumption.entity';

import { BlockchainSyncStatus } from './graphql/dto/energy-consumption.enums';

import { WalletTransactionService } from 'finance/wallet-transactions/wallet-transactions.service';

// ACTION ENUMS
export enum ConsumptionAction {
  REPORT = 'REPORT',
  TERMINATE_EXPIRED = 'TERMINATE_EXPIRED',
  SUSPEND_NO_PRODUCTION = 'SUSPEND_NO_PRODUCTION',
  SUSPEND_NO_FUNDS = 'SUSPEND_NO_FUNDS',
}


// RESULT TYPE
export type ReportConsumptionResult =
  | { action: ConsumptionAction.REPORT; consumption: EnergyConsumption }
  | { action: ConsumptionAction.TERMINATE_EXPIRED }
  | { action: ConsumptionAction.SUSPEND_NO_PRODUCTION }
  | { action: ConsumptionAction.SUSPEND_NO_FUNDS }
  | null;

@Injectable()
export class EnergyConsumptionService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(ENERGY_CONTRACT_BLOCKCHAIN_PORT)
    private readonly blockchainService: IEnergyContractBlockchain,
    private readonly walletTxService: WalletTransactionService,
  ) { }

  async reportConsumption(
    contractId: string,
    kwhConsumed: number,
    platformFeePercent: number = 2,
  ): Promise<ReportConsumptionResult> {

    let contractAddress: string | null = null;
    let buyerWalletAddress: string | null = null;
    let createdConsumption: EnergyConsumption | null = null;
    const kwhToReport = kwhConsumed.toString();

    const result = await this.dataSource.transaction<ReportConsumptionResult>(async manager => {

      const contract = await manager.findOne(EnergyContract, {
        where: { id: contractId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!contract) return null;

      const contractWithRelations = await manager.findOne(EnergyContract, {
        where: { id: contract.id },
        relations: ['buyerWallet', 'sellerWallet'],
      });

      if (!contractWithRelations) return null;

      const { buyerWallet, sellerWallet } = contractWithRelations;

      if (!buyerWallet || !sellerWallet) {
        throw new BadRequestException('Wallets no disponibles');
      }

      if (contract.status !== ContractStatus.ACTIVE || !contract.isActive) {
        return null;
      }

      const now = new Date();

      /* TERMINACIÓN POR VENCIMIENTO */
      if (now > contract.endDate) {
        contract.status = ContractStatus.TERMINATED_TERMS_EXPIRED;
        contract.isActive = false;
        await manager.save(contract);

        contractAddress = contract.contractAddress;

        return { action: ConsumptionAction.TERMINATE_EXPIRED };
      }

      if (kwhConsumed <= 0) return null;

      /* VALIDACIÓN PRODUCCIÓN */
      if (new Decimal(sellerWallet.energyStored).lt(kwhConsumed)) {
        contract.status = ContractStatus.SUSPENDED_NO_PRODUCTION;
        contract.isActive = false;
        await manager.save(contract);

        contractAddress = contract.contractAddress;

        return { action: ConsumptionAction.SUSPEND_NO_PRODUCTION };
      }

      const totalCOP = new Decimal(contract.pricePerKwhCop).mul(kwhConsumed);
      const feeCOP = totalCOP.mul(platformFeePercent).div(100);
      const netCOP = totalCOP.minus(feeCOP);

      /* VALIDACIÓN FONDOS */
      if (new Decimal(buyerWallet.balanceCop).lt(totalCOP)) {
        contract.status = ContractStatus.SUSPENDED_INSUFFICIENT_FUNDS;
        contract.isActive = false;
        await manager.save(contract);

        contractAddress = contract.contractAddress;

        return { action: ConsumptionAction.SUSPEND_NO_FUNDS };
      }

      /* ACTUALIZAR BALANCES */
      buyerWallet.balanceCop = new Decimal(buyerWallet.balanceCop)
        .minus(totalCOP)
        .toString();

      sellerWallet.balanceCop = new Decimal(sellerWallet.balanceCop)
        .plus(netCOP)
        .toString();

      sellerWallet.energyStored = new Decimal(sellerWallet.energyStored)
        .minus(kwhConsumed)
        .toString();

      await manager.save([buyerWallet, sellerWallet]);

      /* CREAR CONSUMO (PENDING) */
      const consumption = await manager.save(
        manager.create(EnergyConsumption, {
          contract,
          energyKwhConsumed: kwhConsumed.toString(),
          costCop: totalCOP.toString(),
          blockchainSyncStatus: BlockchainSyncStatus.PENDING,
        }),
      );

      createdConsumption = consumption;

      await this.walletTxService.recordConsumptionTransaction(
        buyerWallet,
        sellerWallet,
        netCOP.toString(),
        feeCOP.toString(),
        contract.contractAddress,
      );

      contractAddress = contract.contractAddress;
      buyerWalletAddress = buyerWallet.address;

      return {
        action: ConsumptionAction.REPORT,
        consumption,
      };
    });

    /* BLOCKCHAIN (FUERA DE TRANSACCIÓN SQL) */
    if (!result || !contractAddress) {
      return result;
    }

    try {

      if (result.action === ConsumptionAction.REPORT) {

        await this.blockchainService.reportConsumption(
          contractAddress,
          kwhToReport,
        );

        // Burn REC — certifica el consumo de energía renovable on-chain
        try {
          await this.blockchainService.burnREC(
            buyerWalletAddress!,
            contractAddress,
            kwhToReport,
          );
        } catch (error) {
          console.warn('burnREC failed (no crítico):', error);
        }

        await this.dataSource
          .getRepository(EnergyConsumption)
          .update(result.consumption.id, {
            blockchainSyncStatus: BlockchainSyncStatus.SYNCED,
          });

      } else if (result.action === ConsumptionAction.TERMINATE_EXPIRED) {

        await this.blockchainService.terminateByExpiration(contractAddress);

      } else if (result.action === ConsumptionAction.SUSPEND_NO_PRODUCTION) {

        await this.blockchainService.suspendContract(
          contractAddress,
          'Suspendido: No hay producción suficiente',
        );

      } else if (result.action === ConsumptionAction.SUSPEND_NO_FUNDS) {

        await this.blockchainService.suspendContract(
          contractAddress,
          'Suspendido: Fondos insuficientes',
        );
      }

    } catch (error) {

      console.error('Error sincronizando con blockchain', error);

      if (result.action === ConsumptionAction.REPORT) {

        await this.dataSource
          .getRepository(EnergyConsumption)
          .update(result.consumption.id, {
            blockchainSyncStatus: BlockchainSyncStatus.FAILED,
          });
      }
    }

    return result;
  }

  @Cron(' */30 * * * *')
  async retryFailedSyncs(): Promise<void> {

    const repo = this.dataSource.getRepository(EnergyConsumption);

    const failed = await repo.find({
      where: { blockchainSyncStatus: BlockchainSyncStatus.FAILED },
      relations: ['contract'],
    });

    for (const consumption of failed) {
      try {

        await this.blockchainService.reportConsumption(
          consumption.contract.contractAddress,
          consumption.energyKwhConsumed,
        );

        consumption.blockchainSyncStatus = BlockchainSyncStatus.SYNCED;
        await repo.save(consumption);

      } catch (error) {

        console.error(
          `Retry failed for consumption ${consumption.id}`,
          error,
        );

        // Se mantiene en FAILED
      }
    }
  }
}

