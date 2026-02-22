import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { EnergyContract } from '../energy-contracts/energy-contracts.entity';

@Entity('energy_consumptions')
export class EnergyConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 18, scale: 6 })
  energyKwhConsumed: string;

  @Column('decimal', { precision: 18, scale: 0 })
  costCop: string;

  @CreateDateColumn()
  recordedAt: Date;

  // ORM
  @ManyToOne(() => EnergyContract)
  contract: EnergyContract;
}
