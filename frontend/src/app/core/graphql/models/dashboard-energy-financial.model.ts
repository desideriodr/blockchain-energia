export interface HourlyFinancial {
  hour: string;
  incomeCOP: number;
  expenseCOP: number;
}

export interface HourlyEnergy {
  hour: string;
  productionKwh: number;
  consumptionKwh: number;
}

export interface DailyEnergy {
  day: string;
  productionKwh: number;
  consumptionKwh: number;
}

export interface EnergySourceDistribution {
  sourceType: string;
  productionKwh: number;
  capacityKw: number;
}

export interface ContractsCount {
  contractedOffers: number;
  activeContracts: number;
}


export interface DashboardEnergyFinancial {
  hourlyFinancial: HourlyFinancial[];
  hourlyEnergy: HourlyEnergy[];
  monthlyEnergy: DailyEnergy[];
  sourceDistribution: EnergySourceDistribution[];
  energyMonthlyBalance: number;
  walletMonthlyBalance: number;
  contractsCount: ContractsCount[];
}