export interface DashboardKPI {
  totalEnergyProduced: number;
  totalTransactions: number;
  totalEnergyTransferred: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface DashboardHome {
  kpis: DashboardKPI;
  energySeries: TimeSeriesPoint[];
  transactionSeries: TimeSeriesPoint[];
}
