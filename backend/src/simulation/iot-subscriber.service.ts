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

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const url = new URL(redisUrl);
  const isTls = url.protocol === 'rediss:';

  return new Redis({
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    tls: isTls ? {} : undefined,
    maxRetriesPerRequest: null,
  });
}

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
    this.subscriber = createRedisClient();

    this.subscriber.on('connect', () =>
      this.logger.log('IoT Subscriber conectado a Redis Pub/Sub'),
    );

    this.subscriber.psubscribe(
      'iot/meter/*/reading',
      'iot/meter/*/demand',
      (err, count) => {
        if (err) {
          this.logger.error('Error suscribiendose a canales IoT:', err);
          return;
        }
        this.logger.log(`IoT Subscriber activo — ${count} patrones suscritos`);
      },
    );

    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      this.handleMessage(channel, message).catch(err =>
        this.logger.error(`Error procesando mensaje del canal ${channel}:`, err),
      );
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
  }

  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const payload = JSON.parse(message);

      if (channel.endsWith('/reading')) {
        await this.handleMeterReading(payload as IoTMeterReading);
      } else if (channel.endsWith('/demand')) {
        await this.handleMeterDemand(payload as IoTMeterDemand);
      }
    } catch (err) {
      this.logger.error(`Mensaje invalido en canal ${channel}:`, err);
    }
  }

  private async handleMeterReading(payload: IoTMeterReading): Promise<void> {
    const jobData: SimulateSourceJobData = {
      sourceId:   payload.deviceId,
      userId:     payload.userId,
      sourceType: payload.sourceType,
      capacityKw: payload.capacityKw,
    };

    await this.productionQueue.add(SIMULATION_JOB.SIMULATE_SOURCE, jobData);

    this.logger.debug(
      `[IoT→BullMQ] Produccion encolada — device: ${payload.deviceId} tipo: ${payload.sourceType}`,
    );
  }

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
