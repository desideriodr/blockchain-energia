import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

@Injectable()
export class FinanceHelperService {

  /**
   * Calcular comisión de plataforma
   */
  calculateFee(totalCOP: string, feePercent: number = 2) {
    const total = new Decimal(totalCOP);
    const fee = total.mul(feePercent).div(100);
    const net = total.minus(fee);

    return {
      totalCOP: total.toString(),
      feeCOP: fee.toString(),
      netCOP: net.toString(),
    };
  }

  /**
   * Calcular total de contrato
   */
  calculateContractTotal(
    pricePerKwhCop: string,
    totalKwh: string,
  ) {
    const total = new Decimal(pricePerKwhCop).mul(totalKwh);

    return total.toString();
  }
}
