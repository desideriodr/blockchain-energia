import { registerEnumType } from '@nestjs/graphql';

export enum ContractStatus {
  PENDING_BLOCKCHAIN = 'PENDING_BLOCKCHAIN',
  FAILED = 'FAILED',
  ACTIVE = 'ACTIVE',
  TERMINATED_INSUFFICIENT_FUNDS = 'TERMINATED_INSUFFICIENT_FUNDS',
  TERMINATED_NO_PRODUCTION = 'TERMINATED_NO_PRODUCTION',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

registerEnumType(ContractStatus, {
  name: 'ContractStatus',
  description: 'Estados de un contrato',
});