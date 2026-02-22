import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletTransactions } from './wallet-transactions.entity';
import { WalletTransactionService } from './wallet-transactions.service';
import { WalletTransactionResolver } from './wallet-transactions.resolver';
import { WalletService } from 'finance/wallet/wallet.service';
import { Wallet } from 'finance/wallet/wallet.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransactions])],
  providers: [WalletService,WalletTransactionService, WalletTransactionResolver],
  exports: [WalletTransactionService],
})
export class WalletTransactionsModule {}