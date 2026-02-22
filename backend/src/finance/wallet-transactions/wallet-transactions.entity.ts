import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ManyToOne, Index, } from 'typeorm';

import { Wallet } from '../../finance/wallet/wallet.entity';

export enum TxType {
  COP_DEPOSIT = 'cop_deposit',
  COP_WITHDRAW = 'cop_withdraw',
  ENERGY_CONSUMPTION = 'energy_consumption',
  ENERGY_REFUND = 'energy_refund',
  SYSTEM_ADJUST = 'system_adjust',
}

@Entity('wallet_transactions')
export class WalletTransactions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 42 })
  fromAddress: string;

  @Index()
  @Column({ length: 42, nullable: true })
  toAddress?: string;

  @Column('numeric', { precision: 18, scale: 8 })
  amountCop: string;

  @Column({ type: 'enum', enum: TxType })
  type: TxType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  //ORM

  @ManyToOne(() => Wallet, wallet => wallet.outgoingTx, { nullable: false })
  @JoinColumn({ name: 'fromAddress', referencedColumnName: 'address' })
  fromWallet: Wallet;

  @ManyToOne(() => Wallet, wallet => wallet.ingoingTx, { nullable: true })
  @JoinColumn({ name: 'toAddress', referencedColumnName: 'address' })
  toWallet?: Wallet;

}
