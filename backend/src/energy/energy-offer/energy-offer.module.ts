import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from '../../finance/wallet/wallet.entity';
import { EnergyOffer } from './energy-offer.entity';
import { EnergySource } from '../energy-source/energy-source.entity';
import { EnergyProduction } from '../energy-production/energy-production.entity';

import { EnergyOfferService } from './energy-offer.service';
import { EnergyOfferResolver } from './energy-offer.resolver';
import { WalletModule } from '../../finance/wallet/wallet.module';
import { EnergySourceModule } from '../energy-source/energy-source.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      EnergyOffer,
      EnergySource,
      EnergyProduction,
    ]),
    WalletModule,
    EnergySourceModule,
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
