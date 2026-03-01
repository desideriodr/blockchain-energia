import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyContract, ContractStatus } from 'energy/energy-contracts/energy-contracts.entity';
import {
  SIMULATION_QUEUE,
  SIMULATION_JOB,
  SimulateSourceJobData,
  SimulateContractJobData,
} from './simulation.constants';

/**
 * EnergySimulationScheduler — Despachador de jobs
 *
 * Patrón: Productor (BullMQ Productor/Consumidor)
 *
 * Responsabilidad ÚNICA: cada 5 minutos consulta qué fuentes y contratos
 * están activos y encola un job por cada uno.
 *
 * NO procesa nada — solo encola.
 * El procesamiento ocurre en EnergySimulationWorker (hilo separado).
 *
 */
@Injectable()
export class EnergySimulationScheduler {
  private readonly logger = new Logger(EnergySimulationScheduler.name);

  constructor(
    @InjectRepository(EnergySource)
    private readonly sourceRepo: Repository<EnergySource>,

    @InjectRepository(EnergyContract)
    private readonly contractRepo: Repository<EnergyContract>,

    @InjectQueue(SIMULATION_QUEUE.PRODUCTION)
    private readonly productionQueue: Queue,

    @InjectQueue(SIMULATION_QUEUE.CONSUMPTION)
    private readonly consumptionQueue: Queue,
  ) {}

  @Cron('*/5 * * * *')
  async dispatchProductionJobs() {
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

    if (sources.length === 0) return;

    const jobs = sources.map(source => ({
      name: SIMULATION_JOB.SIMULATE_SOURCE,
      data: {
        sourceId: source.id,
        userId: source.user.id,
        sourceType: source.sourceType,
        capacityKw: source.capacityKw,
      } as SimulateSourceJobData,
    }));

    await this.productionQueue.addBulk(jobs);
    this.logger.log(`Encolados ${jobs.length} jobs de producción`);
  }

  @Cron('*/5 * * * *')
  async dispatchConsumptionJobs() {
    const contracts = await this.contractRepo.find({
      where: { status: ContractStatus.ACTIVE, isActive: true },
      select: { id: true, endDate: true },
    });

    if (contracts.length === 0) return;

    const jobs = contracts.map(contract => ({
      name: SIMULATION_JOB.SIMULATE_CONTRACT,
      data: {
        contractId: contract.id,
        endDate: contract.endDate.toISOString(),
      } as SimulateContractJobData,
    }));

    await this.consumptionQueue.addBulk(jobs);
    this.logger.log(`Encolados ${jobs.length} jobs de consumo`);
  }
}
