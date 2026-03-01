import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from 'common/guards/gql-throttler.guard';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import * as dotenv from 'dotenv';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { EnergyProduction } from './energy/energy-production/energy-production.entity';
import { EnergyConsumption } from 'energy/energy-consumption/energy-consumption.entity';
import { createProductionBySourceLoader } from 'energy/energy-production/loaders/production-by-source.loader';
import { createConsumptionsLoader } from 'energy/energy-consumption/loaders/consumptions.loader';

import { BlockchainModule } from './infrastructure/blockchain/blockchain.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EnergySourceModule } from './energy/energy-source/energy-source.module';
import { EnergyProductionModule } from 'energy/energy-production/energy-production.module';
import { EnergySimulationModule } from 'simulation/energy-simulation.module';
import { EnergyOfferModule } from 'energy/energy-offer/energy-offer.module';
import { EnergyContractModule } from 'energy/energy-contracts/energy-contracts.module';
import { EnergyConsumptionModule } from 'energy/energy-consumption/energy-consumption.module';
import { WalletModule } from 'finance/wallet/wallet.module';
import { WalletTransactionsModule } from 'finance/wallet-transactions/wallet-transactions.module';
import { DashboardModule } from 'application/dashboard/dashboard.module';
import { AppCacheModule } from 'infrastructure/cache/cache.module';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    /* RATE LIMITING
     * Patrón: proteción total y automatica de endpoints 
     * ttl: ventana de tiempo (ms)
     * limit: max request por ventana por IP
     *  100 request/IP en producción
     *  100 request/IP en desarrollo 
    */
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: isProd ? 100 : 1000,
      },
    ]),

    // DATABASE
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      // synchronize: solo en desarrollo en produccion puede destruir datos al desplegar
      synchronize: !isProd && process.env.DB_SYNC === 'true',
      // logging: solo en desarrollo en producción expone datos en logs
      logging: !isProd,
    }),

    // GRAPHQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [TypeOrmModule.forFeature([EnergyProduction, EnergyConsumption])],
      inject: [getRepositoryToken(EnergyProduction), getRepositoryToken(EnergyConsumption)],
      useFactory: (pdRepo, consumptionRepo) => ({
        autoSchemaFile: true,
        // playground e introspection: solo en desarrollo en producción expone schema completo 
        playground: !isProd,
        introspection: !isProd,

        path: '/graphql',
        context: ({ req }) => ({
          req,
          loaders: {
            productionLoader: createProductionBySourceLoader(pdRepo),
            createConsumptionsLoader: createConsumptionsLoader(consumptionRepo)
          },
        }),
      }),
    }),

    // SCHEDULER
    ScheduleModule.forRoot(),

    //CACHE (Redis con fallback a memoria)
    AppCacheModule,

    // BULLMQ — Cola de trabajos para simulaciones (requiere Redis)
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_URL
            ? new URL(process.env.REDIS_URL).hostname
            : 'localhost',
          port: process.env.REDIS_URL
            ? parseInt(new URL(process.env.REDIS_URL).port || '6379')
            : 6379,
        },
      }),
    }),

    // FEATURE MODULES
    BlockchainModule,
    UsersModule,
    AuthModule,
    EnergySourceModule,
    EnergyProductionModule,
    EnergySimulationModule,
    EnergyOfferModule,
    EnergyContractModule,
    EnergyConsumptionModule,
    WalletModule,
    WalletTransactionsModule,
    DashboardModule
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule { }
