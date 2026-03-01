import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { Wallet } from 'finance/wallet/wallet.entity';
import { EnergyContract } from 'energy/energy-contracts/energy-contracts.entity';
import { EnergyConsumptionModule } from 'energy/energy-consumption/energy-consumption.module';

import { EnergySimulationScheduler } from './energy-simulation.scheduler';
import { ProductionWorker, ConsumptionWorker } from './energy-simulation.worker';
import { SIMULATION_QUEUE } from './simulation.constants';

/**
 * EnergySimulationModule — Módulo de simulación con BullMQ
 *
 * Registra dos colas separadas:
 *  - simulation:production → jobs de producción de energía por fuente
 *  - simulation:consumption → jobs de consumo por contrato
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnergySource,
      EnergyProduction,
      Wallet,
      EnergyContract,
    ]),

    // Registrar colas BullMQ
    BullModule.registerQueue(
      { name: SIMULATION_QUEUE.PRODUCTION },
      { name: SIMULATION_QUEUE.CONSUMPTION },
    ),

    EnergyConsumptionModule,
  ],
  providers: [
    EnergySimulationScheduler, // dispara jobs — cron producer
    ProductionWorker,           // procesa jobs de producción
    ConsumptionWorker,          // procesa jobs de consumo
  ],
})
export class EnergySimulationModule {}