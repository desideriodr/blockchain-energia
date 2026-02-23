import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Wallet } from "../../finance/wallet/wallet.entity";
import { EnergyConsumption } from "energy/energy-consumption/energy-consumption.entity";

export enum ContractStatus {
    PENDING_BLOCKCHAIN = 'PENDING_BLOCKCHAIN',
    FAILED = 'FAILED',
    ACTIVE = 'ACTIVE',
    TERMINATED_INSUFFICIENT_FUNDS = 'TERMINATED_INSUFFICIENT_FUNDS',
    TERMINATED_NO_PRODUCTION = 'TERMINATED_NO_PRODUCTION',
    CANCELED_BY_BUYER = 'CANCELED_BY_BUYER',
    CANCELED_BY_SELLER = 'CANCELED_BY_SELLER',
    EXPIRED = 'EXPIRED',
    COMPLETED = 'COMPLETED',
}

@Entity('energy_contracts')
export class EnergyContract {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    offerId: string; // referencia histórica

    @Column({ unique: true, nullable: true })
    contractAddress: string;

    @Column('decimal', { precision: 18, scale: 0 })
    pricePerKwhCop: string;

    @Column({
        type: 'enum',
        enum: ContractStatus,
        default: ContractStatus.ACTIVE,
    })
    status: ContractStatus;

    @Column('decimal', { precision: 18, scale: 0, nullable: true })
    commissionCOP?: string;

    @Column('int', { default: 12 })
    contractDurationMonths: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastConsumptionAt?: Date;

    // ORM
    @ManyToOne(() => Wallet)
    sellerWallet: Wallet;

    @ManyToOne(() => Wallet)
    buyerWallet: Wallet;

    @OneToMany(() => EnergyConsumption, consumption => consumption.contract)
    consumptions: EnergyConsumption[];
}
