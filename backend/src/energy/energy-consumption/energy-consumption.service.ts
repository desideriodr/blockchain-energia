import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';

import {
  ContractStatus,
  EnergyContract,
} from 'energy/energy-contracts/energy-contracts.entity';

import { BlockchainService } from 'infrastructure/blockchain/blockchain.service';
import { WalletTransactionService } from 'finance/wallet-transactions/wallet-transactions.service';
import { EnergyConsumption } from './energy-consumption.entity';

@Injectable()
export class EnergyConsumptionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly blockchainService: BlockchainService,
    private readonly walletTxService: WalletTransactionService,
  ) { }

  async reportConsumption(
    contractId: string,
    kwhConsumed: number,
    platformFeePercent: number = 2,
  ) {

    return this.dataSource.transaction(async manager => {

      const contract = await manager.findOne(EnergyContract, {
        where: { id: contractId },
        relations: ['buyerWallet', 'sellerWallet'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!contract || contract.status !== ContractStatus.ACTIVE || !contract.isActive) {
        throw new BadRequestException('Contrato no activo');
      }

      const now = new Date();

      // 🔹 1️⃣ Validar vencimiento
      if (now > contract.endDate) {
        contract.status = ContractStatus.COMPLETED;
        contract.isActive = false;
        await manager.save(contract);
        return null; // no hubo consumo
      }

      if (kwhConsumed <= 0) {
        throw new BadRequestException('Consumo inválido');
      }

      const buyerWallet = contract.buyerWallet;
      const sellerWallet = contract.sellerWallet;

      // 🔹 2️⃣ Validar producción
      if (new Decimal(sellerWallet.energyStored).lt(kwhConsumed)) {
        contract.status = ContractStatus.TERMINATED_NO_PRODUCTION;
        contract.isActive = false;
        await manager.save(contract);
        return null;
      }

      // 🔹 3️⃣ Calcular costo
      const totalCOP = new Decimal(contract.pricePerKwhCop).mul(kwhConsumed);
      const feeCOP = totalCOP.mul(platformFeePercent).div(100);
      const netCOP = totalCOP.minus(feeCOP);

      // 🔹 4️⃣ Validar fondos comprador
      if (new Decimal(buyerWallet.balanceCop).lt(totalCOP)) {
        contract.status = ContractStatus.TERMINATED_INSUFFICIENT_FUNDS;
        contract.isActive = false;
        await manager.save(contract);
        return null;
      }

      // 🔹 5️⃣ Actualizar balances
      buyerWallet.balanceCop = new Decimal(buyerWallet.balanceCop)
        .minus(totalCOP)
        .toString();

      sellerWallet.balanceCop = new Decimal(sellerWallet.balanceCop)
        .plus(netCOP)
        .toString();

      sellerWallet.energyStored = new Decimal(sellerWallet.energyStored)
        .minus(kwhConsumed)
        .toString();

      await manager.save([buyerWallet, sellerWallet]);

      // 🔹 6️⃣ Registrar consumo
      const consumption = await manager.save(
        manager.create(EnergyConsumption, {
          contract,
          energyKwhConsumed: kwhConsumed.toString(),
          costCop: totalCOP.toString(),
        }),
      );

      // 🔹 7️⃣ Registrar transacción
      await this.walletTxService.recordConsumptionTransaction(
        buyerWallet,
        sellerWallet,
        netCOP.toString(),
        feeCOP.toString(),
        contract.contractAddress,
      );

      // 🔹 8️⃣ Blockchain
      await this.blockchainService.reportConsumption(
        contract.contractAddress,
        kwhConsumed.toString(),
      );

      return consumption;
    });
  }


}
