import { Wallet } from './wallet.model';

export interface MeSummary {
  userId: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: string;
  wallet: Wallet;
}
