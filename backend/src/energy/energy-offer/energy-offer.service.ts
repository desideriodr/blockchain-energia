import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';
import { DataSource } from 'typeorm';

import { Wallet } from '../../finance/wallet/wallet.entity';
import { EnergyOffer, EnergyOfferStatus } from './energy-offer.entity';
import { WalletService } from '../../finance/wallet/wallet.service';

@Injectable()
export class EnergyOfferService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
        @InjectRepository(EnergyOffer)
        private readonly offerRepo: Repository<EnergyOffer>,

        private readonly walletService: WalletService,
    ) { }

    async getOpenOffers(): Promise<EnergyOffer[]> {
        return this.offerRepo.find({
            where: { status: EnergyOfferStatus.OPEN },
            relations: [
                'sellerWallet',
                'sellerWallet.user',
            ],
            order: { createdAt: 'DESC' },
        });
    }

    async getMyOffers(userId: string): Promise<EnergyOffer[]> {
        const wallet = await this.walletService.getWalletByUser(userId);

        return this.offerRepo.find({
            where: { sellerWallet: { address: wallet.address } },
            relations: ['sellerWallet', 'sellerWallet.user'],
            order: { createdAt: 'DESC' },
        });
    }

    async createOffer(
        userId: string,
        pricePerKwhCop: string,
    ) {
        if (new Decimal(pricePerKwhCop).lte(0)) {
            throw new BadRequestException('Precio inválido');
        }

        const wallet = await this.walletRepo.findOneByOrFail({ userId });

        return this.offerRepo.save({
            sellerWallet: wallet,
            pricePerKwhCop,
            status: EnergyOfferStatus.OPEN,
        });
    }

    async cancelOffer(userId: string, offerId: string) {
        const offer = await this.offerRepo.findOne({
            where: { id: offerId },
            relations: ['sellerWallet'],
        });

        if (!offer) {
            throw new NotFoundException('Oferta no encontrada');
        }

        if (offer.sellerWallet.userId !== userId) {
            throw new ForbiddenException('No es tu oferta');
        }

        if (offer.status !== EnergyOfferStatus.OPEN) {
            throw new BadRequestException('La oferta no puede ser cancelada');
        }

        offer.status = EnergyOfferStatus.CANCELLED;

        return this.offerRepo.save(offer);
    }

}
