import { WalletTransaction } from './transaction.model';

export interface WalletTransactionPage {
  total: number;
  limit: number;
  offset: number;
  data: WalletTransaction[];
}