import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { EnergyProduction } from '../energy-production/energy-production.entity';

export enum EnergySourceType {
  SOLAR = 'SOLAR',
  EOLICA = 'EOLICA',
  HIDRO = 'HIDRO',
  BIOMASA = 'BIOMASA',
  OTRO = 'OTRO',
}

@Entity('energy_sources')
export class EnergySource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EnergySourceType,
  })
  sourceType: EnergySourceType;

  @Column('float')
  capacityKw: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.energySources, { eager: false })
    user: User;

  @OneToMany(() => EnergyProduction, ep => ep.energySource)
    productions: EnergyProduction[];

}
