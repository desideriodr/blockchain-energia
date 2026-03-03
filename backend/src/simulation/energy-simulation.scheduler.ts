import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { IoTGatewayService } from './iot-gateway.service';

/**
 * EnergySimulationScheduler
 *
 * Responsabilidad única: disparar el ciclo de simulación
 * cada 5 minutos activando el IoT Gateway.
 *
 * Flujo:
 *   Cron → IoTGateway (publica en Redis Pub/Sub)
 *        → IoTSubscriber (escucha y encola en BullMQ)
 *        → Workers (procesan jobs)
 */
@Injectable()
export class EnergySimulationScheduler {
  private readonly logger = new Logger(EnergySimulationScheduler.name);

  constructor(private readonly iotGateway: IoTGatewayService) {}

  @Cron('*/5 * * * *')
  async dispatchProductionReadings() {
    const count = await this.iotGateway.publishProductionReadings();
    if (count > 0) {
      this.logger.log(`[Scheduler] Ciclo producción — ${count} medidores activados`);
    }
  }

  @Cron('*/5 * * * *')
  async dispatchConsumptionReadings() {
    const count = await this.iotGateway.publishDemandReadings();
    if (count > 0) {
      this.logger.log(`[Scheduler] Ciclo consumo — ${count} medidores activados`);
    }
  }
}