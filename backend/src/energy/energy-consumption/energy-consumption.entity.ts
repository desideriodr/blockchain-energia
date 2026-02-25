import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { EnergyContract } from '../energy-contracts/energy-contracts.entity';

export enum BlockchainSyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

@Entity('energy_consumptions')
export class EnergyConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 18, scale: 6 })
  energyKwhConsumed: string;

  @Column('decimal', { precision: 18, scale: 0 })
  costCop: string;

  @Column({
    type: 'enum',
    enum: BlockchainSyncStatus,
    default: BlockchainSyncStatus.PENDING,
  })
  blockchainSyncStatus: BlockchainSyncStatus;

  @CreateDateColumn()
  recordedAt: Date;

  // ORM
  @ManyToOne(() => EnergyContract)
  contract: EnergyContract;
}
