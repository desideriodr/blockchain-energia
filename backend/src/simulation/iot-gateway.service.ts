import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyContract, ContractStatus } from 'energy/energy-contracts/energy-contracts.entity';
import { IOT_CHANNEL, IoTMeterReading, IoTMeterDemand, IoTNetworkStatus } from './iot-gateway.constants';

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
export class IoTGatewayService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(IoTGatewayService.name);
    private publisher: Redis;
    private readonly gatewayId = `gateway-${process.env.NODE_ENV ?? 'dev'}-01`;

    constructor(
        @InjectRepository(EnergySource)
        private readonly sourceRepo: Repository<EnergySource>,

        @InjectRepository(EnergyContract)
        private readonly contractRepo: Repository<EnergyContract>,
    ) { }

    onModuleInit() {
        this.publisher = createRedisClient();
        this.publisher.on('connect', () =>
            this.logger.log(`IoT Gateway conectado — ID: ${this.gatewayId}`),
        );
        this.publisher.on('error', err =>
            this.logger.error('IoT Gateway Redis error:', err),
        );
    }

    async onModuleDestroy() {
        await this.publisher.quit();
    }

    async publishProductionReadings(): Promise<number> {
        const sources = await this.sourceRepo.find({
            where: { isActive: true },
            relations: ['user'],
            select: {
                id: true,
                sourceType: true,
                capacityKw: true,
                user: { id: true },
            },
        });

        if (sources.length === 0) return 0;

        const timestamp = new Date().toISOString();

        await Promise.all(
            sources.map(source => {
                const payload: IoTMeterReading = {
                    deviceId: source.id,
                    userId: source.user.id,
                    sourceType: source.sourceType,
                    capacityKw: source.capacityKw,
                    timestamp,
                    protocol: 'MQTT_SIM',
                };
                return this.publisher.publish(
                    IOT_CHANNEL.METER_READING(source.id),
                    JSON.stringify(payload),
                );
            }),
        );

        this.logger.log(
            `[IoT] ${sources.length} lecturas publicadas — topic: iot/meter/+/reading`,
        );

        return sources.length;
    }

    async publishDemandReadings(): Promise<number> {
        const contracts = await this.contractRepo.find({
            where: { status: ContractStatus.ACTIVE, isActive: true },
            select: { id: true, endDate: true },
        });

        if (contracts.length === 0) return 0;

        const timestamp = new Date().toISOString();

        await Promise.all(
            contracts.map(contract => {
                const payload: IoTMeterDemand = {
                    deviceId: contract.id,
                    contractId: contract.id,
                    endDate: contract.endDate.toISOString(),
                    timestamp,
                    protocol: 'MQTT_SIM',
                };
                return this.publisher.publish(
                    IOT_CHANNEL.METER_DEMAND(contract.id),
                    JSON.stringify(payload),
                );
            }),
        );

        this.logger.log(
            `[IoT] ${contracts.length} demandas publicadas — topic: iot/meter/+/demand`,
        );

        return contracts.length;
    }

    async publishNetworkStatus(activeMeters: number, activeContracts: number): Promise<void> {
        const status: IoTNetworkStatus = {
            activeMeters,
            activeContracts,
            timestamp: new Date().toISOString(),
            gatewayId: this.gatewayId,
        };
        await this.publisher.publish(
            IOT_CHANNEL.NETWORK_STATUS,
            JSON.stringify(status),
        );
    }
}
