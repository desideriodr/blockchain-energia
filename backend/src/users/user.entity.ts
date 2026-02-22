import { Field, ObjectType, ID} from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Wallet } from 'finance/wallet/wallet.entity';
import { EnergySource } from 'energy/energy-source/energy-source.entity';

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
}

@ObjectType()
@Entity('users')
export class User {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  nombres: string;

  @Field()
  @Column()
  apellidos: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Field()
  @Column({ default: 0 })
  balance: number;

  @Field()
  @Column({ default: true })
  activo: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  //relaciones ORM
  @OneToMany(() => Wallet, w => w.user)
  wallets?: Wallet[];

  @OneToMany(() => EnergySource, es => es.user)
  energySources?: EnergySource[];
}
