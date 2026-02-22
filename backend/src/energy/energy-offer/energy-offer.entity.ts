import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from '../../finance/wallet/wallet.entity';

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

    //ORM
    @ManyToOne(() => Wallet, { nullable: false })
    @JoinColumn({ name: 'sellerAddress', referencedColumnName: 'address' })
    sellerWallet: Wallet;
}
