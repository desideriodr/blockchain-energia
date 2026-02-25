import { registerEnumType } from '@nestjs/graphql';

export enum BlockchainSyncStatus {
    PENDING = 'PENDING',
    SYNCED = 'SYNCED',
    FAILED = 'FAILED',
}

registerEnumType(BlockchainSyncStatus, {
    name: 'BlockchainSyncStatus',
    description: 'Estados de una transaccion de consumo',
});