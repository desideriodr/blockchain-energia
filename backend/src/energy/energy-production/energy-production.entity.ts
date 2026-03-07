import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { BlockchainSyncStatus } from 'energy/energy-production/graphql/dto/energy-production.enums';


@Entity('energy_production')
@Index(['energySourceId']) // agregaciones frecuentes por fuente en el dashboard
export class EnergyProduction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 42 })
  producerAddress: string;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: string;

  @Column({
    type: 'enum',
    enum: BlockchainSyncStatus,
    default: BlockchainSyncStatus.PENDING,
  })
  blockchainSyncStatus: BlockchainSyncStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones ORM
  @ManyToOne(() => EnergySource, es => es.productions, { eager: true })
  energySource: EnergySource;
}
