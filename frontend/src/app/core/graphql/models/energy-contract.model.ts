import { EnergyConsumption } from "./energy-consumption.model";

export enum ContractStatus {
  FAILED                      = 'FAILED',
  PENDING_BLOCKCHAIN          = 'PENDING_BLOCKCHAIN',
  ACTIVE                      = 'ACTIVE',
  SUSPENDED_INSUFFICIENT_FUNDS = 'SUSPENDED_INSUFFICIENT_FUNDS',
  SUSPENDED_NO_PRODUCTION     = 'SUSPENDED_NO_PRODUCTION',
  CANCELED_BY_BUYER           = 'CANCELED_BY_BUYER',
  CANCELED_BY_SELLER          = 'CANCELED_BY_SELLER',
  TERMINATED_TERMS_EXPIRED    = 'TERMINATED_TERMS_EXPIRED',
}

export const VISIBLE_CONTRACT_STATUSES: ContractStatus[] = [
  ContractStatus.ACTIVE,
  ContractStatus.SUSPENDED_INSUFFICIENT_FUNDS,
  ContractStatus.SUSPENDED_NO_PRODUCTION,
];

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
  status: ContractStatus;
  startDate: string;
  endDate?: string;
  buyer?: User;
  seller?: User;
  consumptions?: EnergyConsumption[];
}
