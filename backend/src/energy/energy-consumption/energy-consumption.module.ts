import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from '../../finance/wallet/wallet.entity';
import { WalletTransactions } from 'finance/wallet-transactions/wallet-transactions.entity';
import { EnergyContract } from '../energy-contracts/energy-contracts.entity';
import { EnergyConsumption } from './energy-consumption.entity';

import { WalletModule } from '../../finance/wallet/wallet.module';
import { EnergyConsumptionService } from './energy-consumption.service';
import { EnergyConsumptionResolver } from './energy-consumption.resolver';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';
import { WalletTransactionsModule } from 'finance/wallet-transactions/wallet-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletTransactions,
      EnergyContract,
      EnergyConsumption,
    ]),
    WalletModule,
    WalletTransactionsModule,
    BlockchainModule,
  ],
  providers: [
    EnergyConsumptionService,
    EnergyConsumptionResolver,
  ],
  exports: [EnergyConsumptionService],
})
export class EnergyConsumptionModule {}
