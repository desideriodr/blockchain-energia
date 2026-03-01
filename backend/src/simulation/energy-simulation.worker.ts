import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { Wallet } from 'finance/wallet/wallet.entity';

import { EnergyConsumptionService } from 'energy/energy-consumption/energy-consumption.service';

import { SIMULATION_QUEUE, SIMULATION_JOB, SimulateSourceJobData, SimulateContractJobData } from './simulation.constants';

/**
 * ProductionWorker — Procesa jobs de producción de energía
 *
 * Patrón: Consumidor (BullMQ Productor/Consumidor)
 *
 * Cada job contiene el payload de UNA fuente.
 * BullMQ ejecuta los jobs en paralelo con concurrencia configurable,
 * fuera del event loop principal de NestJS.
 */
@Processor(SIMULATION_QUEUE.PRODUCTION)
export class ProductionWorker extends WorkerHost {
  private readonly logger = new Logger(ProductionWorker.name);

  constructor(
    @InjectRepository(EnergyProduction)
    private readonly productionRepo: Repository<EnergyProduction>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {
    super();
  }

  async process(job: Job<SimulateSourceJobData>) {
    if (job.name !== SIMULATION_JOB.SIMULATE_SOURCE) return;

    const { sourceId, userId, sourceType, capacityKw } = job.data;

    const amount = new Decimal(this.calculateProduction(sourceType, capacityKw));
    if (amount.lte(0)) return;

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) {
      this.logger.warn(`Wallet no encontrada para userId ${userId}`);
      return;
    }

    const production = this.productionRepo.create({
      amount: amount.toString(),
      energySource: { id: sourceId } as EnergySource,
      producerAddress: wallet.address,
    });

    await this.productionRepo.save(production);

    wallet.energyStored = new Decimal(wallet.energyStored)
      .plus(amount)
      .toString();

    await this.walletRepo.save(wallet);
  }

  private calculateProduction(sourceType: string, capacityKw: number): string {
    const base = new Decimal(capacityKw);
    const rand = (min: number, max: number) =>
      new Decimal(Math.random() * (max - min) + min);

    switch (sourceType) {
      case 'SOLAR':   return base.mul(rand(0.3, 0.9)).toFixed(4);
      case 'EOLICA':  return base.mul(rand(0.2, 1.0)).toFixed(4);
      case 'HIDRO':   return base.mul(0.8).toFixed(4);
      case 'BIOMASA': return base.mul(0.6).toFixed(4);
      default:        return base.mul(0.3).toFixed(4);
    }
  }
}

/**
 * ConsumptionWorker — Procesa jobs de consumo de energía
 */
@Processor(SIMULATION_QUEUE.CONSUMPTION)
export class ConsumptionWorker extends WorkerHost {
  private readonly logger = new Logger(ConsumptionWorker.name);

  constructor(
    private readonly consumptionService: EnergyConsumptionService,
  ) {
    super();
  }

  async process(job: Job<SimulateContractJobData>) {
    if (job.name !== SIMULATION_JOB.SIMULATE_CONTRACT) return;

    const { contractId, endDate } = job.data;
    const now = new Date();

    // Si venció, reportar con 0 para que el service cierre el contrato
    if (now > new Date(endDate)) {
      await this.consumptionService.reportConsumption(contractId, 0);
      return;
    }

    const kwhToConsume = this.calculateConsumption();
    if (kwhToConsume.lte(0)) return;

    await this.consumptionService.reportConsumption(
      contractId,
      kwhToConsume.toNumber(),
    );
  }

  private calculateConsumption(): Decimal {
    const MAX_KWH_PER_TICK = new Decimal(1);
    return MAX_KWH_PER_TICK.mul(new Decimal(Math.random())).toDecimalPlaces(4);
  }
}
