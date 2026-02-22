import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { EnergySource } from 'energy/energy-source/energy-source.entity';


@Entity('energy_production')
export class EnergyProduction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 42 })
  producerAddress: string;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: string;

  @Column({ nullable: true })
  assetId: number; // opcional, referencia a equipment/asset

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  // Relaciones ORM
  @ManyToOne(() => EnergySource, es => es.productions, { eager: true })
  energySource: EnergySource;
}
