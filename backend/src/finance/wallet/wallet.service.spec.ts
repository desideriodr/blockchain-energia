import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';
import { CryptoService } from 'infrastructure/crypto/crypto.service';

/**
 * WalletService — Tests unitarios
 *
 * Estrategia de mocking:
 * - Repository<Wallet>  → mock manual (no necesitamos BD real)
 * - CryptoService       → mock manual (ya tiene sus propios tests)
 * - ethers.Wallet       → se usa real (determinista, sin side effects)
 */
describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: jest.Mocked<Repository<Wallet>>;
  let cryptoService: jest.Mocked<CryptoService>;

  // Wallet de prueba reutilizable
  const mockWallet: Wallet = {
    id: 'wallet-uuid-123',
    address: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
    privateKey: 'iv:authtag:encrypteddata',
    balanceCop: '0',
    energyStored: '0',
    userId: 'user-uuid-456',
    user: { id: 'user-uuid-456' } as any,
  } as Wallet;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get(getRepositoryToken(Wallet));
    cryptoService = module.get(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.PLATFORM_PRIVATE_KEY;
  });

  // ─── getWalletByUser ───────────────────────────────────────────────────────

  describe('getWalletByUser', () => {
    it('retorna la wallet existente sin crear una nueva', async () => {
      walletRepo.findOne.mockResolvedValue(mockWallet);

      const result = await service.getWalletByUser('user-uuid-456');

      expect(result).toBe(mockWallet);
      expect(walletRepo.findOne).toHaveBeenCalledTimes(1);
      expect(walletRepo.create).not.toHaveBeenCalled();
      expect(walletRepo.save).not.toHaveBeenCalled();
    });

    it('crea una nueva wallet si el usuario no tiene una', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      cryptoService.encrypt.mockReturnValue('iv:tag:encrypted');
      walletRepo.create.mockReturnValue(mockWallet);
      walletRepo.save.mockResolvedValue(mockWallet);

      const result = await service.getWalletByUser('user-uuid-nuevo');

      expect(walletRepo.create).toHaveBeenCalledTimes(1);
      expect(walletRepo.save).toHaveBeenCalledTimes(1);
      expect(cryptoService.encrypt).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    it('cifra la privateKey antes de persistir', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      cryptoService.encrypt.mockReturnValue('iv:tag:encrypted_key');
      walletRepo.create.mockReturnValue(mockWallet);
      walletRepo.save.mockResolvedValue(mockWallet);

      await service.getWalletByUser('user-uuid-nuevo');

      // El primer argumento de encrypt debe ser la privateKey en claro (0x...)
      const encryptedArg = cryptoService.encrypt.mock.calls[0][0];
      expect(encryptedArg).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it('busca la wallet con relación user', async () => {
      walletRepo.findOne.mockResolvedValue(mockWallet);

      await service.getWalletByUser('user-uuid-456');

      expect(walletRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['user']),
        }),
      );
    });
  });

  // ─── getSystemWallet ───────────────────────────────────────────────────────

  describe('getSystemWallet', () => {
    // Cuenta #0 de Hardhat — clave pública conocida
    const HARDHAT_PRIVATE_KEY =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const HARDHAT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    it('lanza error si PLATFORM_PRIVATE_KEY no está definida', async () => {
      delete process.env.PLATFORM_PRIVATE_KEY;
      await expect(service.getSystemWallet()).rejects.toThrow(
        'PLATFORM_PRIVATE_KEY not defined',
      );
    });

    it('retorna la wallet del sistema si ya existe en BD', async () => {
      process.env.PLATFORM_PRIVATE_KEY = HARDHAT_PRIVATE_KEY;
      const systemWallet = { ...mockWallet, address: HARDHAT_ADDRESS };
      walletRepo.findOne.mockResolvedValue(systemWallet);

      const result = await service.getSystemWallet();

      expect(result.address).toBe(HARDHAT_ADDRESS);
      expect(walletRepo.create).not.toHaveBeenCalled();
    });

    it('crea la wallet del sistema si no existe en BD', async () => {
      process.env.PLATFORM_PRIVATE_KEY = HARDHAT_PRIVATE_KEY;
      walletRepo.findOne.mockResolvedValue(null);
      cryptoService.encrypt.mockReturnValue('iv:tag:encrypted');
      const systemWallet = { ...mockWallet, address: HARDHAT_ADDRESS };
      walletRepo.create.mockReturnValue(systemWallet);
      walletRepo.save.mockResolvedValue(systemWallet);

      const result = await service.getSystemWallet();

      expect(walletRepo.create).toHaveBeenCalledTimes(1);
      expect(walletRepo.save).toHaveBeenCalledTimes(1);
      expect(result.address).toBe(HARDHAT_ADDRESS);
    });
  });

  // ─── getDecryptedPrivateKey ────────────────────────────────────────────────

  describe('getDecryptedPrivateKey', () => {
    it('delega el descifrado al CryptoService', async () => {
      const plainKey = '0x' + 'a'.repeat(64);
      cryptoService.decrypt.mockReturnValue(plainKey);

      const result = await service.getDecryptedPrivateKey(mockWallet);

      expect(cryptoService.decrypt).toHaveBeenCalledWith(mockWallet.privateKey);
      expect(result).toBe(plainKey);
    });
  });
});
