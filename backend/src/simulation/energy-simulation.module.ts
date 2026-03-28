import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { Wallet } from 'finance/wallet/wallet.entity';
import { EnergyContract } from 'energy/energy-contracts/energy-contracts.entity';
import { EnergyConsumptionModule } from 'energy/energy-consumption/energy-consumption.module';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';

import { EnergySimulationScheduler } from './energy-simulation.scheduler';
import { ProductionWorker, ConsumptionWorker } from './energy-simulation.worker';
import { SIMULATION_QUEUE } from './simulation.constants';

/**
 * EnergySimulationModule
 *
 * Flujo simplificado sin Redis Pub/Sub:
 *   Cron (Scheduler) → BullMQ → Workers → DB + Blockchain
 *
 * IoTGatewayService e IoTSubscriberService eliminados —
 * eran intermediarios innecesarios que requerían conexiones
 * TCP persistentes incompatibles con Upstash serverless.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnergySource,
      EnergyProduction,
      EnergyContract,
      Wallet,
    ]),
    BullModule.registerQueue(
      { name: SIMULATION_QUEUE.PRODUCTION },
      { name: SIMULATION_QUEUE.CONSUMPTION },
    ),
    EnergyConsumptionModule,
    BlockchainModule,
  ],
  providers: [
    EnergySimulationScheduler,
    ProductionWorker,
    ConsumptionWorker,
  ],
})
export class EnergySimulationModule {}
