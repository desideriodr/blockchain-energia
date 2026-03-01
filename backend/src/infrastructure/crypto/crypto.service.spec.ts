import { CryptoService } from './crypto.service';

/**
 * CryptoService — Tests unitarios
 *
 * No necesita TestingModule — es una clase pura sin inyección de dependencias.
 * Se instancia directamente con la variable de entorno seteada.
 */
describe('CryptoService', () => {
  let service: CryptoService;
  const VALID_KEY = 'test_key_exactamente_32_chars!!!'; // exactamente 32 chars

  beforeEach(() => {
    process.env.WALLET_ENCRYPTION_KEY = VALID_KEY;
    service = new CryptoService();
  });

  afterEach(() => {
    delete process.env.WALLET_ENCRYPTION_KEY;
  });

  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('lanza error si WALLET_ENCRYPTION_KEY no está definida', () => {
      delete process.env.WALLET_ENCRYPTION_KEY;
      expect(() => new CryptoService()).toThrow(
        'WALLET_ENCRYPTION_KEY debe tener exactamente 32 caracteres',
      );
    });

    it('lanza error si WALLET_ENCRYPTION_KEY tiene menos de 32 caracteres', () => {
      process.env.WALLET_ENCRYPTION_KEY = 'clave_corta';
      expect(() => new CryptoService()).toThrow(
        'WALLET_ENCRYPTION_KEY debe tener exactamente 32 caracteres',
      );
    });

    it('lanza error si WALLET_ENCRYPTION_KEY tiene más de 32 caracteres', () => {
      process.env.WALLET_ENCRYPTION_KEY = 'a'.repeat(33);
      expect(() => new CryptoService()).toThrow(
        'WALLET_ENCRYPTION_KEY debe tener exactamente 32 caracteres',
      );
    });

    it('instancia correctamente con clave de exactamente 32 caracteres', () => {
      expect(service).toBeDefined();
    });
  });

  // ─── encrypt ───────────────────────────────────────────────────────────────

  describe('encrypt', () => {
    it('retorna un string en formato iv:authTag:data', () => {
      const result = service.encrypt('mi_private_key');
      const parts = result.split(':');
      expect(parts).toHaveLength(3);
    });

    it('retorna strings hex válidos en cada parte', () => {
      const result = service.encrypt('mi_private_key');
      const [iv, authTag, data] = result.split(':');
      expect(iv).toMatch(/^[0-9a-f]+$/);
      expect(authTag).toMatch(/^[0-9a-f]+$/);
      expect(data).toMatch(/^[0-9a-f]+$/);
    });

    it('el IV tiene 32 hex chars (16 bytes)', () => {
      const [iv] = service.encrypt('test').split(':');
      expect(iv).toHaveLength(32);
    });

    it('el authTag tiene 32 hex chars (16 bytes)', () => {
      const [, authTag] = service.encrypt('test').split(':');
      expect(authTag).toHaveLength(32);
    });

    it('genera ciphertexts distintos para el mismo plaintext (IV aleatorio)', () => {
      const a = service.encrypt('misma_clave_privada');
      const b = service.encrypt('misma_clave_privada');
      expect(a).not.toBe(b);
    });

    it('cifra strings vacíos sin lanzar error', () => {
      expect(() => service.encrypt('')).not.toThrow();
    });

    it('cifra private keys de Ethereum (formato 0x + 64 hex)', () => {
      const privateKey = '0x' + 'a'.repeat(64);
      expect(() => service.encrypt(privateKey)).not.toThrow();
    });
  });

  // ─── decrypt ───────────────────────────────────────────────────────────────

  describe('decrypt', () => {
    it('recupera el plaintext original después de cifrar', () => {
      const original = 'mi_private_key_secreta';
      const ciphertext = service.encrypt(original);
      expect(service.decrypt(ciphertext)).toBe(original);
    });

    it('round-trip: cifrar → descifrar → igual al original', () => {
      const texts = [
        '0x' + 'f'.repeat(64),       // private key Ethereum
        'texto con espacios y ñ',     // caracteres especiales
        'a',                           // string mínimo
        'x'.repeat(500),              // string largo
      ];

      texts.forEach(text => {
        expect(service.decrypt(service.encrypt(text))).toBe(text);
      });
    });

    it('lanza error si el formato no es iv:authTag:data', () => {
      expect(() => service.decrypt('formato_invalido')).toThrow(
        'Formato de ciphertext inválido',
      );
    });

    it('lanza error si el ciphertext fue manipulado (authTag inválido)', () => {
      const ciphertext = service.encrypt('dato_sensible');
      const [iv, , data] = ciphertext.split(':');
      const authTagFalso = 'ff'.repeat(16); // authTag incorrecto
      const manipulado = `${iv}:${authTagFalso}:${data}`;

      expect(() => service.decrypt(manipulado)).toThrow();
    });

    it('lanza error si se usa una clave diferente para descifrar', () => {
      const ciphertext = service.encrypt('dato_sensible');

      // Crear servicio con clave diferente
      process.env.WALLET_ENCRYPTION_KEY = 'otra_clave_distinta_32_chars!!!!';
      const otroService = new CryptoService();

      expect(() => otroService.decrypt(ciphertext)).toThrow();
    });
  });
});
