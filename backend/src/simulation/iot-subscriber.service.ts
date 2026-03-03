import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

import {
  IOT_CHANNEL,
  IoTMeterReading,
  IoTMeterDemand,
} from './iot-gateway.constants';
import {
  SIMULATION_QUEUE,
  SIMULATION_JOB,
  SimulateSourceJobData,
  SimulateContractJobData,
} from './simulation.constants';

/**
 * IoTSubscriberService — Suscriptor de mensajes IoT
 *
 * Escucha los canales Redis Pub/Sub donde el IoTGateway
 * publica las lecturas de los medidores inteligentes.
 *
 * Al recibir una lectura la convierte en un job BullMQ
 * para su procesamiento asíncrono por los Workers.
 *
 * Patrón: Subscriber (Redis Pub/Sub) → Producer (BullMQ)
 *
 */
@Injectable()
export class IoTSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IoTSubscriberService.name);
  private subscriber: Redis;

  constructor(
    @InjectQueue(SIMULATION_QUEUE.PRODUCTION)
    private readonly productionQueue: Queue,

    @InjectQueue(SIMULATION_QUEUE.CONSUMPTION)
    private readonly consumptionQueue: Queue,
  ) {}

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

    // Redis Pub/Sub requiere una conexión dedicada —
    // una conexión en modo subscribe no puede usarse para otros comandos
    this.subscriber = new Redis(redisUrl);

    this.subscriber.on('connect', () =>
      this.logger.log('IoT Subscriber conectado a Redis Pub/Sub'),
    );

    // Suscribirse a los patrones de topics MQTT simulados
    // psubscribe permite wildcard: iot/meter/*/reading
    this.subscriber.psubscribe(
      'iot/meter/*/reading',  // lecturas de producción
      'iot/meter/*/demand',   // lecturas de consumo
      (err, count) => {
        if (err) {
          this.logger.error('Error suscribiéndose a canales IoT:', err);
          return;
        }
        this.logger.log(`IoT Subscriber activo — ${count} patrones suscritos`);
      },
    );

    // Handler de mensajes recibidos
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      this.handleMessage(channel, message).catch(err =>
        this.logger.error(`Error procesando mensaje del canal ${channel}:`, err),
      );
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
  }

  /**
   * Enruta el mensaje al handler correcto según el topic.
   * Replica el comportamiento de un broker MQTT que enruta
   * mensajes a suscriptores por topic.
   */
  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const payload = JSON.parse(message);

      if (channel.endsWith('/reading')) {
        await this.handleMeterReading(payload as IoTMeterReading);
      } else if (channel.endsWith('/demand')) {
        await this.handleMeterDemand(payload as IoTMeterDemand);
      }
    } catch (err) {
      this.logger.error(`Mensaje inválido en canal ${channel}:`, err);
    }
  }

  /**
   * Convierte una lectura de producción IoT en un job BullMQ.
   * El Worker procesará el job fuera del event loop principal.
   */
  private async handleMeterReading(payload: IoTMeterReading): Promise<void> {
    const jobData: SimulateSourceJobData = {
      sourceId:   payload.deviceId,
      userId:     payload.userId,
      sourceType: payload.sourceType,
      capacityKw: payload.capacityKw,
    };

    await this.productionQueue.add(SIMULATION_JOB.SIMULATE_SOURCE, jobData);

    this.logger.debug(
      `[IoT→BullMQ] Producción encolada — device: ${payload.deviceId} tipo: ${payload.sourceType}`,
    );
  }

  /**
   * Convierte una lectura de demanda IoT en un job BullMQ.
   */
  private async handleMeterDemand(payload: IoTMeterDemand): Promise<void> {
    const jobData: SimulateContractJobData = {
      contractId: payload.contractId,
      endDate:    payload.endDate,
    };

    await this.consumptionQueue.add(SIMULATION_JOB.SIMULATE_CONTRACT, jobData);

    this.logger.debug(
      `[IoT→BullMQ] Consumo encolado — device: ${payload.deviceId}`,
    );
  }
}