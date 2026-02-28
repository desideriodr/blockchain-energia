import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers, Wallet as EthersWallet } from 'ethers';

import { Wallet } from './wallet.entity';
import { CryptoService } from 'infrastructure/crypto/crypto.service';

/* WalletService
 *
 * Maneja la logica de wallets de los usuarios
 *
 */


@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly cryptoService: CryptoService,

  ) { }

  /* Obtiene o crea la wallet del usuario
   * crear: cifra la privateKey antes de persistir
   * obtener: retorna el objeto con privateKey ya cifrada 
   */
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
        privateKey: this.cryptoService.encrypt(ethersWallet.privateKey),
        balanceCop: '0',
        energyStored: '0',
      });
      wallet = await this.walletRepo.save(wallet);
    }

    return wallet;
  }

  /* Wallet del sistema (Oraculo blockchain)
   * primaryKey del sistema se asigna en variables de entorno
   * ya esta protegida en sistema secrets local
   */
  async getSystemWallet(): Promise<Wallet> {
    const privateKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!privateKey) throw new Error('PLATFORM_PRIVATE_KEY not defined');

    const ethersWallet = new ethers.Wallet(privateKey);

    let wallet = await this.walletRepo.findOne({
      where: { address: ethersWallet.address }
    });
    
    if (!wallet) {
      wallet = this.walletRepo.create({
        address: ethersWallet.address,
        privateKey: this.cryptoService.encrypt(privateKey),
        balanceCop: '0',
        energyStored: '0',
      });
      await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  /* Decifra y retorna la privateKey en claro
   * Solo para firmar una transacción
   * nunca usar para exponer valor en GraphQL ni en logs
   */
  async getDecryptedPrivateKey(wallet: Wallet): Promise<string> {
    return this.cryptoService.decrypt(wallet.privateKey);
  }  
}