import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyProduction } from './energy-production.entity';
import { EnergyProductionService } from './energy-production.service';
import { EnergyProductionResolver } from './energy-production.resolver';
import { EnergySource } from 'energy/energy-source/energy-source.entity';
import { Wallet } from 'finance/wallet/wallet.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([
            EnergyProduction,
            EnergySource,
            Wallet
        ]),
    ],
    providers: [
        EnergyProductionService,
        EnergyProductionResolver
    ],
    exports: [EnergyProductionService],
})
export class EnergyProductionModule { }
