import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnergySimulationService } from './energy-simulation.service';
import { EnergySource } from '../../energy/energy-source/energy-source.entity';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { Wallet } from '../wallet/wallet.entity';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';
import { EnergyContract } from '../../energy/energy-contracts/energy-contracts.entity';
import { WalletTransactions } from '../wallet-transactions/wallet-transactions.entity';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';
import { EnergyConsumptionModule } from 'energy/energy-consumption/energy-consumption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnergySource,
      EnergyProduction,
      Wallet,
      EnergyConsumption,
      EnergyContract,
      WalletTransactions
    ]), BlockchainModule, EnergyConsumptionModule,
  ],
  providers: [EnergySimulationService],
})
export class EnergySimulationModule {}
