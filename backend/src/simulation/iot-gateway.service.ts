import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyContract, ContractStatus } from 'energy/energy-contracts/energy-contracts.entity';
import { IOT_CHANNEL, IoTMeterReading, IoTMeterDemand, IoTNetworkStatus } from './iot-gateway.constants';

/**
 * IoTGatewayService — Simula un gateway de dispositivos IoT
 *
 * Publica lecturas de medidores inteligentes en Redis Pub/Sub
 * usando topics con estructura MQTT.
 *
 * En un sistema real este gateway recibiría datos via:
 *   - MQTT broker (Mosquitto, HiveMQ)
 *   - CoAP (Constrained Application Protocol)
 *   - LoRaWAN para dispositivos de largo alcance
 *
 * Patrón: Publisher (Redis Pub/Sub)
 */
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
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        this.publisher = new Redis(redisUrl);
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

    /**
     * Publica lecturas de producción de todas las fuentes activas.
     * Cada fuente tiene un medidor inteligente virtual que reporta
     * su producción al gateway cada 5 minutos.
     */
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

    /**
     * Publica lecturas de demanda de todos los contratos activos.
     * Cada contrato tiene un medidor de consumo virtual en el
     * punto de entrega del comprador.
     */
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

    /** Publica estado general de la red — dashboard */
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