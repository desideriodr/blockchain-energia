import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DashboardKPI } from "../analytics/graphql/dashboard-kpi.graphql";
import { TimeSeriesPoint } from "./graphql/time-series.graphql";
import { DashboardHome } from "./graphql/dashboard-home.graphql";

import { WalletService } from "finance/wallet/wallet.service";
import { EnergyProduction } from "energy/energy-production/energy-production.entity";
import { EnergyConsumption } from "energy/energy-consumption/energy-consumption.entity";
import { WalletTransactions } from "finance/wallet-transactions/wallet-transactions.entity";
import { EnergySource } from "energy/energy-source/energy-source.entity";
import { ContractsCount, DailyEnergy, EnergySourceDistribution, HourlyEnergy, HourlyFinancial } from "./graphql/dashboard-energy-financial";
import { EnergyContract } from "energy/energy-contracts/energy-contracts.entity";

@Injectable()
export class DashboardService {

  constructor(
    private readonly walletService: WalletService,

    @InjectRepository(EnergyProduction)
    private readonly pdRepo: Repository<EnergyProduction>,

    @InjectRepository(EnergyConsumption)
    private readonly consumptionRepo: Repository<EnergyConsumption>,

    @InjectRepository(WalletTransactions)
    private readonly txRepo: Repository<WalletTransactions>,

    @InjectRepository(EnergySource)
    private readonly sourceRepo: Repository<EnergySource>,

    @InjectRepository(EnergyContract)
    private readonly contractRepo: Repository<EnergyContract>
  ) { }

  async getDashboardKPI(userId: string): Promise<DashboardKPI> {
    const wallet = await this.walletService.getWalletByUser(userId);

    const totalTransactions = await this.txRepo.count({
      where: [
        { fromAddress: wallet.address },
        { toAddress: wallet.address },
      ],
    });

    const totalEnergyTransferred = 0;

    const produced = await this.pdRepo
      .createQueryBuilder('pd')
      .innerJoin('pd.energySource', 'es')
      .select('COALESCE(SUM(pd.amount), 0)', 'sum')
      .where('es.userId = :userId', { userId })
      .getRawOne();

    return {
      totalTransactions,
      totalEnergyTransferred,
      totalEnergyProduced: Number(produced.sum),
    };
  }

  async getDashboardHome(userId: string): Promise<DashboardHome> {
    const kpis = await this.getDashboardKPI(userId);

    // 🔹 Aquí puedes luego poner lógica real por fechas
    const energySeries: TimeSeriesPoint[] = [];
    const transactionSeries: TimeSeriesPoint[] = [];

    return {
      kpis,
      energySeries,
      transactionSeries,
    };
  }

  /* ============================================================
     HOURLY FINANCIAL
  ============================================================ */

  async getHourlyFinancial(userId: string): Promise<HourlyFinancial[]> {
    const wallet = await this.walletService.getWalletByUser(userId);
    const address = wallet.address;

    const raw = await this.txRepo
      .createQueryBuilder('wt')
      .select(`TO_CHAR(DATE_TRUNC('hour', wt."createdAt"), 'HH24:00')`, 'hour')
      .addSelect(`
        SUM(
          CASE 
            WHEN wt."toAddress" = :address 
            THEN wt."amountCop"::numeric
            ELSE 0
          END
        )
      `, 'income')
      .addSelect(`
        SUM(
          CASE 
            WHEN wt."fromAddress" = :address 
            THEN wt."amountCop"::numeric
            ELSE 0
          END
        )
      `, 'expense')
      .where(`DATE(wt."createdAt") = CURRENT_DATE`)
      .andWhere(`
        wt."fromAddress" = :address 
        OR wt."toAddress" = :address
      `)
      .setParameter('address', address)
      .groupBy(`DATE_TRUNC('hour', wt."createdAt")`)
      .orderBy(`DATE_TRUNC('hour', wt."createdAt")`, 'ASC')
      .getRawMany();

    return this.fillMissingHours(raw);
  }

  private fillMissingHours(data: any[]) {
    const map = new Map(
      data.map(d => [
        d.hour,
        {
          hour: d.hour,
          incomeCOP: Number(d.income) || 0,
          expenseCOP: Number(d.expense) || 0,
        },
      ])
    );

    const result: {
      hour: string;
      incomeCOP: number;
      expenseCOP: number;
    }[] = [];

    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, '0')}:00`;
      result.push(
        map.get(label) || {
          hour: label,
          incomeCOP: 0,
          expenseCOP: 0,
        }
      );
    }

    return result;
  }

  /* ============================================================
     HOURLY ENERGY (Hoy)
  ============================================================ */

  async getHourlyEnergy(userId: string): Promise<HourlyEnergy[]> {
    const production = await this.pdRepo
      .createQueryBuilder('pd')
      .innerJoin('pd.energySource', 'es')
      .select(`TO_CHAR(DATE_TRUNC('hour', pd."createdAt"), 'HH24:00')`, 'hour')
      .addSelect('SUM(pd.amount)', 'production')
      .where('es.userId = :userId', { userId })
      .andWhere(`DATE(pd."createdAt") = CURRENT_DATE`)
      .groupBy(`DATE_TRUNC('hour', pd."createdAt")`)
      .getRawMany();

    const consumption = await this.consumptionRepo
      .createQueryBuilder('ec')
      .select(`TO_CHAR(DATE_TRUNC('hour', ec."recordedAt"), 'HH24:00')`, 'hour')
      .addSelect('SUM(ec."energyKwhConsumed")', 'consumption')
      .where(`DATE(ec."recordedAt") = CURRENT_DATE`)
      .groupBy(`DATE_TRUNC('hour', ec."recordedAt")`)
      .getRawMany();

    const prodMap = new Map(production.map(p => [p.hour, Number(p.production)]));
    const consMap = new Map(consumption.map(c => [c.hour, Number(c.consumption)]));

    const result: {
      hour: string;
      productionKwh: number;
      consumptionKwh: number;
    }[] = [];

    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, '0')}:00`;
      result.push({
        hour: label,
        productionKwh: prodMap.get(label) || 0,
        consumptionKwh: consMap.get(label) || 0,
      });
    }

    return result;
  }

  /* ============================================================
     MONTHLY ENERGY (por día)
  ============================================================ */

  async getMonthlyEnergy(userId: string): Promise<DailyEnergy[]> {
    const production = await this.pdRepo
      .createQueryBuilder('pd')
      .innerJoin('pd.energySource', 'es')
      .select(`TO_CHAR(pd."createdAt", 'YYYY-MM-DD')`, 'day')
      .addSelect('SUM(pd.amount)', 'production')
      .where('es.userId = :userId', { userId })
      .andWhere(`DATE_TRUNC('month', pd."createdAt") = DATE_TRUNC('month', CURRENT_DATE)`)
      .groupBy('day')
      .getRawMany();

    const consumption = await this.consumptionRepo
      .createQueryBuilder('ec')
      .select(`TO_CHAR(ec."recordedAt", 'YYYY-MM-DD')`, 'day')
      .addSelect('SUM(ec."energyKwhConsumed")', 'consumption')
      .andWhere(`DATE_TRUNC('month', ec."recordedAt") = DATE_TRUNC('month', CURRENT_DATE)`)
      .groupBy('day')
      .getRawMany();

    const prodMap = new Map(production.map(p => [p.day, Number(p.production)]));
    const consMap = new Map(consumption.map(c => [c.day, Number(c.consumption)]));

    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const result: {
      day: string;
      productionKwh: number;
      consumptionKwh: number;
    }[] = [];

    const year = now.getFullYear();
    const month = now.getMonth();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const label = date.toISOString().slice(0, 10);

      result.push({
        day: label,
        productionKwh: prodMap.get(label) || 0,
        consumptionKwh: consMap.get(label) || 0,
      });
    }

    return result;
  }

  /* ============================================================
     SOURCE DISTRIBUTION
  ============================================================ */

  async getSourceDistribution(userId: string): Promise<EnergySourceDistribution[]> {
    const raw = await this.pdRepo
      .createQueryBuilder('pd')
      .innerJoin('pd.energySource', 'es')
      .select('es.sourceType', 'sourceType')
      .addSelect('SUM(pd.amount)', 'production')
      .addSelect('es.capacityKw', 'capacity')
      .where('es.userId = :userId', { userId })
      .groupBy('es.sourceType')
      .addGroupBy('es.capacityKw')
      .getRawMany();

    return raw.map(r => ({
      sourceType: r.sourceType,
      productionKwh: Number(r.production),
      capacityKw: Number(r.capacity),
    }));
  }

  /* ============================================================
     CONTRACTS COUNT
  ============================================================ */

  async getContractsCount(userId:string): Promise<ContractsCount[]> {
    const wallet = await this.walletService.getWalletByUser(userId);
    const walletId = wallet.id;

    const raw = await this.contractRepo
    .createQueryBuilder('ec')
    .select(`
        SUM(
          CASE 
            WHEN ec."sellerWalletId" = :id 
            THEN 1
            ELSE 0
          END
        )
      `, 'contractedOffers')
      .addSelect(`
        SUM(
          CASE 
            WHEN ec."buyerWalletId" = :id 
            THEN 1
            ELSE 0
          END
        )
      `, 'activeContracts')
    .where(`ec.status = status`)
      .andWhere(`
        ec."sellerWalletId" = :id 
        OR ec."buyerWalletId" = :id
      `)
      .setParameter('id', walletId)
      .setParameter('status', "ACTIVE")
    .groupBy('ec.status')
    .getRawMany();

    return raw.map(r => ({
      contractedOffers: r.contractedOffers,
      activeContracts: r.activeContracts
    }));

  }

  /* ============================================================
     MAIN ENTRY
  ============================================================ */

  async getEnergyFinancialDashboard(userId: string) {
    const [hourlyFinancial, hourlyEnergy, monthlyEnergy, sourceDistribution, contractsCount] =
      await Promise.all([
        this.getHourlyFinancial(userId),
        this.getHourlyEnergy(userId),
        this.getMonthlyEnergy(userId),
        this.getSourceDistribution(userId),
        this.getContractsCount(userId)
      ]);

    return {
      hourlyFinancial,
      hourlyEnergy,
      monthlyEnergy,
      sourceDistribution,
      contractsCount,
    };
  }
}
