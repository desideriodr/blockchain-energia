import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from './wallet.entity';
import { WalletTransactions } from 'finance/wallet-transactions/wallet-transactions.entity';

import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransactions])],
  providers: [WalletService, WalletResolver],
  exports: [WalletService],
})
export class WalletModule {}