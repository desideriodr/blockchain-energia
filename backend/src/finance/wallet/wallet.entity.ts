import { Column, Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from 'users/user.entity';
import { WalletTransactions } from 'finance/wallet-transactions/wallet-transactions.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @Column({ unique: true })
  address: string;

  @Column({ type: 'varchar', nullable: false })
  privateKey: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  balanceCop: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  energyStored: string;

  // ORM
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => WalletTransactions, tx => tx.fromWallet)
  outgoingTx: WalletTransactions[];

  @OneToMany(() => WalletTransactions, tx => tx.toWallet)
  ingoingTx: WalletTransactions[];

}
