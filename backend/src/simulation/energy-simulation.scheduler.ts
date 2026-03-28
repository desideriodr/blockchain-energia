import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { EnergyContract, ContractStatus } from 'energy/energy-contracts/energy-contracts.entity';
import {
  SIMULATION_QUEUE,
  SIMULATION_JOB,
  SimulateSourceJobData,
  SimulateContractJobData,
} from './simulation.constants';

/**
 * EnergySimulationScheduler
 *
 * Dispara el ciclo de simulacion cada 5 minutos encolando
 * jobs directamente en BullMQ — sin intermediario Redis Pub/Sub.
 *
 * Flujo simplificado:
 *   Cron → BullMQ → Workers → DB + Blockchain
 */
@Injectable()
export class EnergySimulationScheduler {
  private readonly logger = new Logger(EnergySimulationScheduler.name);

  constructor(
    @InjectQueue(SIMULATION_QUEUE.PRODUCTION)
    private readonly productionQueue: Queue,

    @InjectQueue(SIMULATION_QUEUE.CONSUMPTION)
    private readonly consumptionQueue: Queue,

    @InjectRepository(EnergySource)
    private readonly sourceRepo: Repository<EnergySource>,

    @InjectRepository(EnergyContract)
    private readonly contractRepo: Repository<EnergyContract>,
  ) {}

  @Cron('*/5 * * * *')
  async dispatchProductionReadings(): Promise<void> {
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

    await Promise.all(
      sources.map(source => {
        const jobData: SimulateSourceJobData = {
          sourceId:   source.id,
          userId:     source.user.id,
          sourceType: source.sourceType,
          capacityKw: source.capacityKw,
        };
        return this.productionQueue.add(SIMULATION_JOB.SIMULATE_SOURCE, jobData);
      }),
    );

    this.logger.log(`[Scheduler] Produccion — ${sources.length} fuentes encoladas`);
  }

  @Cron('*/5 * * * *')
  async dispatchConsumptionReadings(): Promise<void> {
    const contracts = await this.contractRepo.find({
      where: { status: ContractStatus.ACTIVE, isActive: true },
      select: { id: true, endDate: true },
    });

    if (contracts.length === 0) return;

    await Promise.all(
      contracts.map(contract => {
        const jobData: SimulateContractJobData = {
          contractId: contract.id,
          endDate:    contract.endDate.toISOString(),
        };
        return this.consumptionQueue.add(SIMULATION_JOB.SIMULATE_CONTRACT, jobData);
      }),
    );

    this.logger.log(`[Scheduler] Consumo — ${contracts.length} contratos encolados`);
  }
}
