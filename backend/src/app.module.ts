import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as dotenv from 'dotenv';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { BlockchainModule } from './infrastructure/blockchain/blockchain.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EnergySourceModule } from './energy/energy-source/energy-source.module';

import { EnergyProduction } from './energy/energy-production/energy-production.entity';
import { createProductionLoader } from './energy/energy-production/loaders/production.loader';
import { EnergySimulationModule } from 'simulation/energy-simulation.module';
import { EnergyOfferModule } from 'energy/energy-offer/energy-offer.module';
import { EnergyContractModule } from 'energy/energy-contracts/energy-contracts.module';
import { EnergyConsumptionModule } from 'energy/energy-consumption/energy-consumption.module';
import { WalletModule } from 'finance/wallet/wallet.module';

import { DashboardModule } from 'application/dashboard/dashboard.module';
import { EnergyProductionModule } from 'energy/energy-production/energy-production.module';
import { WalletTransactionsModule } from 'finance/wallet-transactions/wallet-transactions.module';

dotenv.config();

@Module({
  imports: [
    // ---------------- DATABASE ----------------
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),

    // ---------------- GRAPHQL ----------------
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [TypeOrmModule.forFeature([EnergyProduction])],
      inject: [getRepositoryToken(EnergyProduction)],
      useFactory: (pdRepo) => ({
        autoSchemaFile: true,
        playground: true,
        path: '/graphql',
        context: ({ req }) => ({
          req,
          loaders: {
            productionLoader: createProductionLoader(pdRepo),
          },
        }),
      }),
    }),

    // ---------------- SCHEDULER ----------------
    ScheduleModule.forRoot(),

    // ---------------- FEATURE MODULES ----------------
    // ------------------- BLOCKCHAIN ----------------
    BlockchainModule,
    // ------------------- USER/AUTH -----------------
    UsersModule,
    AuthModule,
    // ------------------ ENERGY -------------------
    EnergySourceModule,
    EnergyProductionModule,
    EnergySimulationModule,
    EnergyOfferModule,
    EnergyContractModule,
    EnergyConsumptionModule,
    // ------------------ WALLET -------------------
    WalletModule,
    WalletTransactionsModule, 
    // ------------------ DASHBOARD ---------------
    DashboardModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
