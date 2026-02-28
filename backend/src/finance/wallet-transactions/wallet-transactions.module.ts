import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletTransactions } from './wallet-transactions.entity';
import { WalletTransactionService } from './wallet-transactions.service';
import { WalletTransactionResolver } from './wallet-transactions.resolver';
import { Wallet } from 'finance/wallet/wallet.entity';
import { CryptoModule } from 'infrastructure/crypto/crypto.module';
import { WalletModule } from 'finance/wallet/wallet.module';


@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransactions]),
  WalletModule,
  CryptoModule],
  providers: [WalletTransactionService, WalletTransactionResolver],
  exports: [WalletTransactionService],
})
export class WalletTransactionsModule {}