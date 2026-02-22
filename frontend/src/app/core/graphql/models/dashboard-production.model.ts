export interface ProductionSourceSummary {
  sourceId: string;
  sourceType: string;
  capacityKw: number;
  producedTotal: number;
  producedToday: number;
}

export interface ProductionDashboard {
  energyStored: number;
  sources: ProductionSourceSummary[];
}
