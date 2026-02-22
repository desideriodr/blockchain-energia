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
}