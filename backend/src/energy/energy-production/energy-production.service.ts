import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { EnergyProduction } from './energy-production.entity';
import { EnergySource } from '../energy-source/energy-source.entity';
import { Wallet } from '../../finance/wallet/wallet.entity';
import { TimeSeriesPoint } from 'application/dashboard/graphql/time-series.graphql';

@Injectable()
export class EnergyProductionService {
  constructor(
    @InjectRepository(EnergyProduction)
    private readonly productionRepo: Repository<EnergyProduction>,

    @InjectRepository(EnergySource)
    private readonly sourceRepo: Repository<EnergySource>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) { }

  async getProductionDashboard(user: User) {
    const sources = await this.sourceRepo.find({
      where: {
        user: { id: user.id },
        isActive: true,
      },
    });

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: user.id } },
    });

    const result: {
      sourceId: string;
      sourceType: string;
      capacityKw: number;
      producedTotal: number;
      producedToday: number;
    }[] = [];

    for (const source of sources) {
      const producedTotal = await this.productionRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'sum')
        .where('p.energySourceId = :id', { id: source.id })
        .getRawOne();

      const producedToday = await this.productionRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'sum')
        .where('p.energySourceId = :id', { id: source.id })
        .andWhere('p.createdAt >= CURRENT_DATE')
        .getRawOne();

      result.push({
        sourceId: source.id,
        sourceType: source.sourceType,
        capacityKw: source.capacityKw,
        producedTotal: Number(producedTotal.sum || 0),
        producedToday: Number(producedToday.sum || 0),
      });
    }

    return {
      energyStored: wallet?.energyStored ?? 0,
      sources: result,
    };
  }

  async getEnergyProducedByDay(userId: string): Promise<TimeSeriesPoint[]> {
    const result = await this.productionRepo
      .createQueryBuilder('pd')
      .innerJoin('pd.energySource', 'es')
      .select(`DATE(pd."createdAt")`, 'date')
      .addSelect('SUM(pd.amount)', 'value')
      .where('es.userId = :uid', { uid: userId })
      .groupBy(`DATE(pd."createdAt")`)
      .orderBy('date', 'ASC')
      .getRawMany();
    return result.map(r => ({
      date: r.date,
      value: Number(r.value),
    }));
  }
}