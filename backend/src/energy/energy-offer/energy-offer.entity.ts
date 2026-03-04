import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from '../../finance/wallet/wallet.entity';
import { EnergySource } from '../energy-source/energy-source.entity';

export enum EnergyOfferStatus {
    OPEN = 'OPEN',
    CANCELLED = 'CANCELLED',
}

@Entity('energy_offers')
export class EnergyOffer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('decimal', { precision: 18, scale: 0 })
    pricePerKwhCop: string;

    @Column({
        type: 'enum',
        enum: EnergyOfferStatus,
        default: EnergyOfferStatus.OPEN,
    })
    status: EnergyOfferStatus;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    sellerAddress: string;

    // ORM — wallet del vendedor
    @ManyToOne(() => Wallet, { nullable: false })
    @JoinColumn({ name: 'sellerAddress', referencedColumnName: 'address' })
    sellerWallet: Wallet;

    // ORM — fuente de energía que respalda la oferta
    @Column()
    energySourceId: string;

    @ManyToOne(() => EnergySource, { nullable: false, eager: false })
    @JoinColumn({ name: 'energySourceId' })
    energySource: EnergySource;
}
