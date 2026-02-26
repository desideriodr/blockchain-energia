import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { WalletTransactions } from 'finance/wallet-transactions/wallet-transactions.entity';
import { WalletModule } from 'finance/wallet/wallet.module';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { UsersModule } from 'users/users.module';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';
import { EnergySource } from 'energy/energy-source/energy-source.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyProduction, EnergyConsumption, EnergySource, WalletTransactions]),
    WalletModule,UsersModule
  ],
  providers: [DashboardService, DashboardResolver],
  exports: [DashboardService],
})
export class DashboardModule {}
