import { registerEnumType } from '@nestjs/graphql';

export enum ContractStatus {
  FAILED = 'FAILED',
  PENDING_BLOCKCHAIN = 'PENDING_BLOCKCHAIN',
  ACTIVE = 'ACTIVE',
  SUSPENDED_INSUFFICIENT_FUNDS = 'SUSPENDED_INSUFFICIENT_FUNDS',
  SUSPENDED_NO_PRODUCTION = 'SUSPENDED_NO_PRODUCTION',
  CANCELED_BY_BUYER = 'CANCELED_BY_BUYER',
  CANCELED_BY_SELLER = 'CANCELED_BY_SELLER',
  TERMINATED_TERMS_EXPIRED = 'TERMINATED_TERMS_EXPIRED',
}

registerEnumType(ContractStatus, {
  name: 'ContractStatus',
  description: 'Estados de un contrato',
});