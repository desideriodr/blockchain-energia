export type TxType =
  | 'cop_deposit'
  | 'cop_withdraw'
  | 'energy_consumption'
  | 'energy_refund'
  | 'system_adjust';

export interface WalletTransaction {
  id: number;
  fromAddress: string;
  toAddress?: string;
  grossAmountCop: number;
  feeCOP: number;
  amountCop: number;
  type: TxType;
  createdAt: string;
}
