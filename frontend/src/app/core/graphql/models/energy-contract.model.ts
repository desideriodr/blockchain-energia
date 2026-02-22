import { EnergyConsumption } from "./energy-consumption.model";

export type EnergyOfferStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'TERMINATED';

export interface User {
  id: string;
  nombres: string;
  apellidos: string;
}

export interface Wallet {
  id: string;
  address: string;
  user: User;
}

export interface EnergyContract {
  id: string;
  offerId: string;
  sellerWallet: Wallet;
  buyerWallet: Wallet;
  pricePerKwhCop: number;
  status: EnergyOfferStatus;
  startDate: string;
  endDate?: string;
  buyer?: User;
  seller?: User;
  consumptions?: EnergyConsumption[];
}
