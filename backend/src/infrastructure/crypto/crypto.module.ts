import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/* CryptoModule — Módulo de infraestructura de cifrado
 *
 * Se importa en cualquier módulo que necesite cifrar/descifrar datos sensibles.
 * Actualmente usado por WalletModule para proteger privateKeys.
 */
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
