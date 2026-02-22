import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';

import { EnergySource } from '../../energy/energy-source/energy-source.entity';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { Wallet } from '../wallet/wallet.entity';
import { EnergyContract, ContractStatus } from '../../energy/energy-contracts/energy-contracts.entity';
import { EnergyConsumptionService } from '../../energy/energy-consumption/energy-consumption.service';

@Injectable()
export class EnergySimulationService {
  private readonly logger = new Logger(EnergySimulationService.name);

  constructor(
    @InjectRepository(EnergySource)
    private readonly sourceRepo: Repository<EnergySource>,

    @InjectRepository(EnergyProduction)
    private readonly productionRepo: Repository<EnergyProduction>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    @InjectRepository(EnergyContract)
    private readonly contractRepo: Repository<EnergyContract>,

    private readonly consumptionService: EnergyConsumptionService,
  ) { }

  /**
   * ===============================
   * PRODUCCIÓN DE ENERGÍA
   * ===============================
   */

  // cada 5 minutos
  @Cron('*/5 * * * *')
  async simulateProduction() {
    const sources = await this.sourceRepo.find({
      where: { isActive: true },
      relations: ['user'],
    });

    for (const source of sources) {
      const amount = new Decimal(this.calculateProduction(source));
      if (amount.lte(0)) continue;

      const wallet = await this.walletRepo.findOne({
        where: { user: { id: source.user.id } },
      });

      if (!wallet) continue;

      // registrar producción
      const production = this.productionRepo.create({
        amount: amount.toString(),
        energySource: source,
        producerAddress: wallet.address,
      });

      await this.productionRepo.save(production);

      // acumular energía en wallet
      wallet.energyStored = new Decimal(wallet.energyStored)
        .plus(amount)
        .toString();

      await this.walletRepo.save(wallet);
    }
  }

  private calculateProduction(source: EnergySource): string {
    const base = new Decimal(source.capacityKw);

    const rand = (min: number, max: number) =>
      new Decimal(Math.random() * (max - min) + min);

    switch (source.sourceType) {
      case 'SOLAR':
        return base.mul(rand(0.3, 0.9)).toFixed(4);
      case 'EOLICA':
        return base.mul(rand(0.2, 1.0)).toFixed(4);
      case 'HIDRO':
        return base.mul(0.8).toFixed(4);
      case 'BIOMASA':
        return base.mul(0.6).toFixed(4);
      default:
        return base.mul(0.3).toFixed(4);
    }
  }

  /**
   * ===============================
   * CONSUMO AUTOMÁTICO
   * ===============================
   */

  // cada 5 minuto
  @Cron('*/5 * * * *')
  async simulateConsumption() {

    const now = new Date();

    const contracts = await this.contractRepo.find({
      where: {
        status: ContractStatus.ACTIVE,
        isActive: true,
      },
      relations: ['sellerWallet'],
    });

    for (const contract of contracts) {

      // 🔹 Si venció, dejar que el service lo cierre
      if (now > contract.endDate) {
        try {
          await this.consumptionService.reportConsumption(
            contract.id,
            0,
          );
        } catch (e) {
          this.logger.warn(`Error cerrando contrato ${contract.id}`);
        }
        continue;
      }

      const kwhToConsume = this.calculateConsumption(contract);

      if (kwhToConsume.lte(0)) continue;

      try {
        await this.consumptionService.reportConsumption(
          contract.id,
          kwhToConsume.toNumber(),
        );
      } catch (error) {
        this.logger.warn(
          `Error consumiendo contrato ${contract.id}: ${error.message}`,
        );
      }
    }
  }


  private calculateConsumption(contract: EnergyContract): Decimal {
  /**
   * Regla EaaS:
   * - hasta 1 kWh por tick (5 min)
   * - consumo variable
   * - no depende del contrato
   */

  const MAX_KWH_PER_TICK = new Decimal(1);

  const randomFactor = new Decimal(Math.random()); // 0 - 1

  return MAX_KWH_PER_TICK
    .mul(randomFactor)
    .toDecimalPlaces(4);
}

}
