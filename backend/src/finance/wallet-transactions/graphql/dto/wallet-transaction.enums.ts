import { registerEnumType } from '@nestjs/graphql';

export enum TxType {
  COP_DEPOSIT = 'cop_deposit',
  COP_WITHDRAW = 'cop_withdraw',
  ENERGY_CONSUMPTION = 'energy_consumption',
  ENERGY_REFUND = 'energy_refund',
  SYSTEM_ADJUST = 'system_adjust',
}

registerEnumType(TxType, {
  name: 'TxType',
  description: 'Tipos de transacciones del wallet',
});
