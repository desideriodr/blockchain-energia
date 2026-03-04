import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';
import { DataSource } from 'typeorm';

import { Wallet } from '../../finance/wallet/wallet.entity';
import { EnergyOffer, EnergyOfferStatus } from './energy-offer.entity';
import { EnergySource } from '../energy-source/energy-source.entity';
import { EnergyProduction } from '../energy-production/energy-production.entity';
import { WalletService } from '../../finance/wallet/wallet.service';

export interface ProductionSummaryBySource {
  sourceId: string;
  sourceType: string;
  capacityKw: number;
  availableKwh: number;
  productionCount: number;
}

@Injectable()
export class EnergyOfferService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,

        @InjectRepository(EnergyOffer)
        private readonly offerRepo: Repository<EnergyOffer>,

        @InjectRepository(EnergySource)
        private readonly sourceRepo: Repository<EnergySource>,

        @InjectRepository(EnergyProduction)
        private readonly productionRepo: Repository<EnergyProduction>,

        private readonly walletService: WalletService,
    ) { }

    async getOpenOffers(): Promise<EnergyOffer[]> {
        return this.offerRepo.find({
            where: { status: EnergyOfferStatus.OPEN },
            relations: [
                'sellerWallet',
                'sellerWallet.user',
                'energySource',
            ],
            order: { createdAt: 'DESC' },
        });
    }

    async getMyOffers(userId: string): Promise<EnergyOffer[]> {
        const wallet = await this.walletService.getWalletByUser(userId);

        return this.offerRepo.find({
            where: { sellerWallet: { address: wallet.address } },
            relations: ['sellerWallet', 'sellerWallet.user', 'energySource'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retorna las producciones del usuario agrupadas por fuente de energía,
     * con el total de kWh disponibles (SYNCED) por cada fuente.
     * Sirve para que el productor elija qué fuente publicar como oferta.
     */
    async getMyProductionsBySource(userId: string): Promise<ProductionSummaryBySource[]> {
        const sources = await this.sourceRepo.find({
            where: { user: { id: userId }, isActive: true },
        });

        if (sources.length === 0) return [];

        const sourceIds = sources.map(s => s.id);

        const rows = await this.productionRepo
            .createQueryBuilder('p')
            .select('p.energySourceId', 'sourceId')
            .addSelect('SUM(p.amount)', 'availableKwh')
            .addSelect('COUNT(p.id)', 'productionCount')
            .where('p.energySourceId IN (:...ids)', { ids: sourceIds })
            .andWhere('p.blockchainSyncStatus = :status', { status: 'SYNCED' })
            .groupBy('p.energySourceId')
            .getRawMany();

        const summaryMap = new Map(rows.map(r => [r.sourceId, r]));

        return sources.map(source => {
            const row = summaryMap.get(source.id);
            return {
                sourceId: source.id,
                sourceType: source.sourceType,
                capacityKw: source.capacityKw,
                availableKwh: row ? Number(row.availableKwh) : 0,
                productionCount: row ? Number(row.productionCount) : 0,
            };
        });
    }

    async createOffer(
        userId: string,
        pricePerKwhCop: string,
        energySourceId: string,
    ) {
        if (new Decimal(pricePerKwhCop).lte(0)) {
            throw new BadRequestException('Precio inválido');
        }

        // Validar que la fuente existe y pertenece al usuario
        const source = await this.sourceRepo.findOne({
            where: { id: energySourceId },
            relations: ['user'],
        });

        if (!source) {
            throw new NotFoundException('Fuente de energía no encontrada');
        }

        if (source.user.id !== userId) {
            throw new ForbiddenException('La fuente de energía no te pertenece');
        }

        if (!source.isActive) {
            throw new BadRequestException('La fuente de energía no está activa');
        }

        const wallet = await this.walletRepo.findOneByOrFail({ userId });

        return this.offerRepo.save({
            sellerWallet: wallet,
            sellerAddress: wallet.address,
            pricePerKwhCop,
            status: EnergyOfferStatus.OPEN,
            energySourceId: source.id,
            energySource: source,
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
