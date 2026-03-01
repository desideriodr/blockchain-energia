import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { WalletTransactions } from 'finance/wallet-transactions/wallet-transactions.entity';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';
import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyContract } from 'energy/energy-contracts/energy-contracts.entity';

import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';

import { WalletModule } from 'finance/wallet/wallet.module';
import { UsersModule } from 'users/users.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyProduction, EnergyConsumption, EnergySource, EnergyContract, WalletTransactions]),
    WalletModule,
    UsersModule,
    CacheModule.register(),
  ],
  providers: [DashboardService, DashboardResolver],
  exports: [DashboardService],
})
export class DashboardModule {}
