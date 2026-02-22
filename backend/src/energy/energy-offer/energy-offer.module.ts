import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from '../../finance/wallet/wallet.entity';
import { EnergyOffer } from './energy-offer.entity';

import { EnergyOfferService } from './energy-offer.service';
import { EnergyOfferResolver } from './energy-offer.resolver';
import { WalletModule } from '../../finance/wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      EnergyOffer,
    ]),
    WalletModule,
  ],
  providers: [
    EnergyOfferService,
    EnergyOfferResolver,
  ],
  exports: [
    EnergyOfferService,
  ],
})
export class EnergyOfferModule {}
