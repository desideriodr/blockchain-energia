import { EnergySource } from './energy-source.model';

export type EnergyOfferStatus =
  | 'OPEN'
  | 'CONTRATED'
  | 'CANCELLED';

export interface EnergyOffer {
  id: string;
  pricePerKwhCop: number;
  status: EnergyOfferStatus;
  createdAt: string;
  seller: {
    nombres: string;
    apellidos: string;
  };
  energySource: EnergySource;
}

export interface ProductionSummaryBySource {
  sourceId: string;
  sourceType: string;
  capacityKw: number;
  availableKwh: number;
  productionCount: number;
}
