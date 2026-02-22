import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Wallet } from './wallet.entity';
import { ethers, Wallet as EthersWallet } from 'ethers';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

  ) { }

  /** Obtiene o crea la wallet del usuario */
  async getWalletByUser(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!wallet) {
      const ethersWallet = EthersWallet.createRandom();

      wallet = this.walletRepo.create({
        user: { id: userId } as any,
        address: ethersWallet.address,
        privateKey: ethersWallet.privateKey,
        balanceCop: '0',
        energyStored: '0',
      });
      wallet = await this.walletRepo.save(wallet);
    }

    return wallet;
  }

  /** Wallet del sistema (ETH backend) */
  async getSystemWallet(): Promise<Wallet> {
    const privateKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!privateKey) throw new Error('PLATFORM_PRIVATE_KEY not defined');

    const ethersWallet = new ethers.Wallet(privateKey);

    let wallet = await this.walletRepo.findOne({ where: { address: ethersWallet.address } });
    if (!wallet) {
      wallet = this.walletRepo.create({
        address: ethersWallet.address,
        privateKey,
        balanceCop: '0',
        energyStored: '0',
      });
      await this.walletRepo.save(wallet);
    }
    return wallet;
  }
}