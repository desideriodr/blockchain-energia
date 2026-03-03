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
import { IoTGatewayService } from './iot-gateway.service';
import { IoTSubscriberService } from './iot-subscriber.service';
import { SIMULATION_QUEUE } from './simulation.constants';

/**
 * EnergySimulationModule — Módulo de simulación con BullMQ
 *
 * Registra dos colas separadas:
 *  - simulation:production → jobs de producción de energía por fuente
 *  - simulation:consumption → jobs de consumo por contrato
 *  Fujo completo:
 *    IoTGateway → Redis Pub/Sub → IoTSubscriber → BullMQ → Worker → DB + Blockchain
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
  ],
  providers: [
    EnergySimulationScheduler, // cron — activa el gateway
    IoTGatewayService,         // publica en Redis Pub/Sub
    IoTSubscriberService,      // suscribe y encola en BullMQ
    ProductionWorker,          // procesa jobs de producción
    ConsumptionWorker,         // procesa jobs de consumo
  ],
})
export class EnergySimulationModule {}