import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';

import { Wallet } from '../wallet/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactions, TxType } from './wallet-transactions.entity';
import { TimeSeriesPoint } from 'application/dashboard/graphql/time-series.graphql';
import { MeSummary } from 'application/dashboard/graphql/me-summary.graphql';

@Injectable()
export class WalletTransactionService {
  constructor(
    private readonly walletService: WalletService,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    @InjectRepository(WalletTransactions)
    private readonly txRepo: Repository<WalletTransactions>,
  ) { }

  /** Trae todas las transacciones del usuario */
  async findMyTransactions(
    userId: string,
    options?: { type?: TxType; limit?: number; offset?: number }
  ) {
    const wallet = await this.walletService.getWalletByUser(userId);
    const { type, limit = 20, offset = 0 } = options ?? {};

    const qb = this.txRepo.createQueryBuilder('tx')
      .where('(tx.fromAddress = :addr OR tx.toAddress = :addr)', { addr: wallet.address });

    if (type) qb.andWhere('tx.type = :type', { type });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('tx.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return { total, limit, offset, data };
  }

  /** Número de transacciones por día para gráficas */
  async getTransactionsByDay(userId: string): Promise<TimeSeriesPoint[]> {
    const wallet = await this.walletService.getWalletByUser(userId);

    const rows = await this.txRepo
      .createQueryBuilder('tx')
      .select('DATE(tx.createdAt)', 'date')
      .addSelect('COUNT(*)', 'value')
      .where('(tx.fromAddress = :addr OR tx.toAddress = :addr)', { addr: wallet.address })
      .groupBy('DATE(tx.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map(r => ({ date: r.date, value: Number(r.value) }));
  }

  /** Depositar COP del usuario con comisión */
  async depositCOP(userId: string, amount: number, feePercent: number = 2): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    const wallet = await this.walletService.getWalletByUser(userId);
    const systemWallet = await this.walletService.getSystemWallet();

    const amountDec = new Decimal(amount);
    const feeDec = amountDec.mul(feePercent).div(100); // comisión de la plataforma
    const netAmount = amountDec.minus(feeDec);

    // registrar transacción COP_DEPOSIT
    await this.txRepo.save({
      fromWallet: systemWallet,
      toWallet: wallet,
      txHash: undefined,
      fromAddress: 'SYSTEM',
      toAddress: wallet.address,
      amountCop: netAmount.toString(),
      type: TxType.COP_DEPOSIT,
      confirmedOnChain: false,
      metadata: { feeCOP: feeDec.toString(), grossAmountCop: amountDec.toString() },
    });

    // actualizar balance
    wallet.balanceCop = new Decimal(wallet.balanceCop).plus(netAmount).toString();

    return this.walletRepo.save(wallet);
  }

  /** Retiro COP del usuario */
  async withdrawCOP(userId: string, amount: number, feePercent: number = 0): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    const wallet = await this.walletService.getWalletByUser(userId);
    const balance = new Decimal(wallet.balanceCop);
    const amountDec = new Decimal(amount);

    if (balance.lessThan(amountDec)) throw new BadRequestException('Insufficient funds');

    const feeDec = amountDec.mul(feePercent).div(100);
    const netAmount = amountDec.minus(feeDec);

    wallet.balanceCop = balance.minus(amountDec).toString(); // se descuenta total del usuario

    // registrar transacción COP_WITHDRAW
    await this.txRepo.save({
      fromWallet: wallet,
      toWallet: undefined,
      txHash: undefined,
      fromAddress: wallet.address,
      toAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // dirección de retiro (ejemplo)
      amountCop: netAmount.toString(),
      type: TxType.COP_WITHDRAW,
      confirmedOnChain: false,
      metadata: { feeCOP: feeDec.toString() },
    });

    return this.walletRepo.save(wallet);
  }

  /** Resumen de wallet del usuario */
  async getMeSummary(user): Promise<MeSummary> {
    const wallet = await this.walletRepo.findOne({ where: { user: { id: user.id } } });

    // opcional: sumar todas las comisiones pagadas por el usuario
    const totalFees = await this.txRepo
      .createQueryBuilder('tx')
      .select('SUM(CAST(tx.metadata->>\'feeCOP\' AS DECIMAL))', 'sum')
      .where('(tx.fromAddress = :addr OR tx.toAddress = :addr)', { addr: wallet?.address })
      .getRawOne();

    return {
      userId: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      role: user.role,
      wallet: {
        address: wallet?.address ?? '',
        balanceCop: Number(wallet?.balanceCop ?? 0),
        energyStored: Number(wallet?.energyStored ?? 0),
      },
    };
  }

  async recordConsumptionTransaction(
    buyerWallet: Wallet,
    sellerWallet: Wallet,
    netCOP: string,
    feeCOP: string,
    contractAddress: string,
  ) {
    // Registrar transacción neta
    await this.txRepo.save({
      fromWallet: buyerWallet,
      toWallet: sellerWallet,
      txHash: undefined,
      fromAddress: buyerWallet.address,
      toAddress: sellerWallet.address,
      amountCop: netCOP,
      type: TxType.ENERGY_CONSUMPTION,
      confirmedOnChain: false,
      metadata: {
        feeCOP,
        contractAddress,
      },
    });
  }

}
