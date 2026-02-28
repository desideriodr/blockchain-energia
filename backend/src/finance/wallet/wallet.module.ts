import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from './wallet.entity';
import { WalletTransactions } from 'finance/wallet-transactions/wallet-transactions.entity';

import { WalletService } from './wallet.service';

import { WalletResolver } from './wallet.resolver';

import { CryptoModule } from 'infrastructure/crypto/crypto.module';

/* 
 * WalletModule — Módulo de wallets de usuarios
 */
@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransactions]),
    CryptoModule
  ],
  providers: [WalletService, WalletResolver],
  exports: [WalletService],
})
export class WalletModule { }