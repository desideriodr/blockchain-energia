import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnergyConsumption } from './energy-consumption.entity';

import { EnergyConsumptionService } from './energy-consumption.service';

import { EnergyConsumptionResolver } from './energy-consumption.resolver';

import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';
import { WalletTransactionsModule } from 'finance/wallet-transactions/wallet-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyConsumption]),
    BlockchainModule,
    WalletTransactionsModule,
  ],
  providers: [
    EnergyConsumptionService,
    EnergyConsumptionResolver,
  ],
  exports: [EnergyConsumptionService],
})
export class EnergyConsumptionModule {}
