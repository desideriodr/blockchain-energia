import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Wallet } from "../../finance/wallet/wallet.entity";
import { EnergyConsumption } from "energy/energy-consumption/energy-consumption.entity";

export enum ContractStatus {
    FAILED = 'FAILED',
    PENDING_BLOCKCHAIN = 'PENDING_BLOCKCHAIN',
    ACTIVE = 'ACTIVE',
    SUSPENDED_INSUFFICIENT_FUNDS = 'SUSPENDED_INSUFFICIENT_FUNDS',
    SUSPENDED_NO_PRODUCTION = 'SUSPENDED_NO_PRODUCTION',
    CANCELED_BY_BUYER = 'CANCELED_BY_BUYER',
    CANCELED_BY_SELLER = 'CANCELED_BY_SELLER',
    TERMINATED_TERMS_EXPIRED = 'TERMINATED_TERMS_EXPIRED',
}

@Entity('energy_contracts')
export class EnergyContract {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    offerId: string; // referencia histórica

    @Column({ unique: true, nullable: true })
    contractAddress: string;

    @Column({ length: 20 })
    sourceType: string; // SOLAR, EOLICA, HIDRO, BIOMASA, OTRO

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
