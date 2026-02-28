import { Injectable } from "@nestjs/common"
import * as crypto from 'crypto'

/* CryptoService - infraestructura de cifrado
 * 
 * Patrón: Adaptador (Arquitectura Hexagonal)
 * Algoritmo: AES-256-GCM
 * 
 * Este servicio se encarga de ejecutar encrypt/decrypt
 * cuando son llamados por la logica del negocio
 */

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;

    // en main.ts se validó si existe y longitud 32 chars, confirmamos que sea correcto
    if (!encryptionKey || encryptionKey.length !== 32) {
      throw new Error('WALLET_ENCRYPTION_KEY debe tener exactamente 32 caracteres');
    }

    // Convertir el string a Buffer de 32 bytes para AES-256
    this.key = Buffer.from(encryptionKey, 'utf8');
  }

  /* funcion encrypt
   * 
   * Cifra un texto plano y retorna el ciphertext en formato: iv:authTag:data
   * Usado para cifrar privateKey antes de guardar en BD.
   */
  encrypt(plaintext: string): string {
    // IV (Initialization Vector): 16 bytes aleatorios únicos por cada cifrado
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // authTag: 16 bytes que verifican integridad del ciphertext (GCM feature)
    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:encryptedData — todo en hex para almacenar en VARCHAR
    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  /* funcion decrypt
   * 
   * Descifra un ciphertext en formato iv:authTag:data
   * Usado para obtener la privateKey antes de firmar transacciones.
   * Lanza error si el ciphertext fue manipulado (authTag inválido).
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Formato de ciphertext inválido');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    // Si el authTag no coincide, GCM lanzará un error aquí.
    // Esto detecta tanto manipulación como uso de clave incorrecta.
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
