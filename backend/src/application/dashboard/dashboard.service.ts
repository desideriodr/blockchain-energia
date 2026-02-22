import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DashboardKPI } from "../analytics/graphql/dashboard-kpi.graphql";
import { TimeSeriesPoint } from "./graphql/time-series.graphql";
import { DashboardHome } from "./graphql/dashboard-home.graphql";

import { WalletService } from "finance/wallet/wallet.service";
import { EnergyProduction } from "energy/energy-production/energy-production.entity";
import { WalletTransactions } from "finance/wallet-transactions/wallet-transactions.entity";

@Injectable()
export class DashboardService {

  constructor(
    private readonly walletService: WalletService,

    @InjectRepository(EnergyProduction)
    private readonly pdRepo: Repository<EnergyProduction>,

    @InjectRepository(WalletTransactions)
    private readonly txRepo: Repository<WalletTransactions>,
  ) {}

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
}
