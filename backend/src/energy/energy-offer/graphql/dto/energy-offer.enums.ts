import { registerEnumType } from '@nestjs/graphql';

export enum EnergyOfferStatus {
  OPEN = 'OPEN',
  CANCELLED = 'CANCELLED',
}

registerEnumType(EnergyOfferStatus, {
  name: 'EnergyOfferStatus',
  description: 'Estados de una oferta',
});
