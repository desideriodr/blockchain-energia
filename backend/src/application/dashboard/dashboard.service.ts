import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

import { cacheKey, CACHE_TTL } from "infrastructure/cache/cache.constants";

import { EnergyProduction } from "energy/energy-production/energy-production.entity";
import { EnergyConsumption } from "energy/energy-consumption/energy-consumption.entity";
import { WalletTransactions } from "finance/wallet-transactions/wallet-transactions.entity";
import { EnergySource } from "energy/energy-source/energy-source.entity";
import { EnergyContract } from "energy/energy-contracts/energy-contracts.entity";

import { DashboardKPI } from "../analytics/graphql/dashboard-kpi.graphql";
import { TimeSeriesPoint } from "./graphql/time-series.graphql";
import { DashboardHome } from "./graphql/dashboard-home.graphql";
import { ContractsCount, DailyEnergy, EnergySourceDistribution, HourlyEnergy, HourlyFinancial } from "./graphql/dashboard-energy-financial.graphql";

import { WalletService } from "finance/wallet/wallet.service";

@Injectable()
export class DashboardService {

  constructor(
    private readonly walletService: WalletService,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,

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
    const key = cacheKey.dashboardKpi(userId);
    const cached = await this.cache.get<DashboardKPI>(key);
    if (cached) return cached;

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

    const result = {
      totalTransactions,
      totalEnergyTransferred,
      totalEnergyProduced: Number(produced.sum),
    };

    await this.cache.set(key, result, CACHE_TTL.DASHBOARD_KPI);
    return result;
  }

  async getDashboardHome(userId: string): Promise<DashboardHome> {
    const kpis = await this.getDashboardKPI(userId);

    const energySeries: TimeSeriesPoint[] = [];
    const transactionSeries: TimeSeriesPoint[] = [];

    return {
      kpis,
      energySeries,
      transactionSeries,
    };
  }

  /* HOURLY FINANCIAL - movimientos financieros x hora */
  async getHourlyFinancial(userId: string): Promise<HourlyFinancial[]> {
    const key = cacheKey.hourlyFinancial(userId);
    const cached = await this.cache.get<HourlyFinancial[]>(key);
    if (cached) return cached;

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

    const result = this.fillMissingHours(raw);
    await this.cache.set(key, result, CACHE_TTL.HOURLY_FINANCIAL);
    return result;
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

  /* HOURLY ENERGY (Hoy) - produccion/consumo de energia diaria */
  async getHourlyEnergy(userId: string): Promise<HourlyEnergy[]> {
    const key = cacheKey.hourlyEnergy(userId);
    const cached = await this.cache.get<HourlyEnergy[]>(key);
    if (cached) return cached;

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

    const result: HourlyEnergy[] = [];

    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, '0')}:00`;
      result.push({
        hour: label,
        productionKwh: prodMap.get(label) || 0,
        consumptionKwh: consMap.get(label) || 0,
      });
    }

    await this.cache.set(key, result, CACHE_TTL.HOURLY_ENERGY);
    return result;
  }

  /* MONTHLY ENERGY (por día) - produccion/consumo de energia mensual */
  async getMonthlyEnergy(userId: string): Promise<DailyEnergy[]> {
    const key = cacheKey.monthlyEnergy(userId);
    const cached = await this.cache.get<DailyEnergy[]>(key);
    if (cached) return cached;

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
    const result: DailyEnergy[] = [];

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

    await this.cache.set(key, result, CACHE_TTL.MONTHLY_ENERGY);
    return result;
  }

  /*SOURCE DISTRIBUTION - produccion clasificada por su fuente de energia*/
  async getSourceDistribution(userId: string): Promise<EnergySourceDistribution[]> {
    const key = cacheKey.sourceDistribution(userId);
    const cached = await this.cache.get<EnergySourceDistribution[]>(key);
    if (cached) return cached;

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

    const result = raw.map(r => ({
      sourceType: r.sourceType,
      productionKwh: Number(r.production),
      capacityKw: Number(r.capacity),
    }));

    await this.cache.set(key, result, CACHE_TTL.SOURCE_DISTRIBUTION);
    return result;
  }

  /* CONTRACTS COUNT - conteo de contractos activos y offertas publicadas */
  async getContractsCount(userId: string): Promise<ContractsCount[]> {
    const key = cacheKey.contractsCount(userId);
    const cached = await this.cache.get<ContractsCount[]>(key);
    if (cached) return cached;

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

    const result = raw.map(r => ({
      contractedOffers: r.contractedOffers,
      activeContracts: r.activeContracts
    }));

    await this.cache.set(key, result, CACHE_TTL.CONTRACTS_COUNT);
    return result;
  }

  /* MAIN ENTRY - todo el dashboard se construye con esta funcion
   * asi que podemos agregar o quitar queries
   * solo con declarar o no la funcion get<something>(userid) correspondiente */
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
