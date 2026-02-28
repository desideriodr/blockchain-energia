import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnergyContract } from './energy-contracts.entity';
import { EnergyConsumption } from '../energy-consumption/energy-consumption.entity';

import { EnergyContractService } from './energy-contracts.service';

import { EnergyContractResolver } from './energy-contracts.resolver';

import { WalletModule } from '../../finance/wallet/wallet.module';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';
import { FinanceModule } from 'infrastructure/finance/finance.module';


@Module({
    imports: [TypeOrmModule.forFeature([EnergyContract, EnergyConsumption]),
        WalletModule,
        BlockchainModule,
        FinanceModule,
    ],
    providers: [EnergyContractService, EnergyContractResolver],
    exports: [EnergyContractService],
})

export class EnergyContractModule { }

