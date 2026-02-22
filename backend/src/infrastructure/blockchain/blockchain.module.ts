import { Module } from '@nestjs/common';

import { EnergySupplyGateway } from './energy-supply.gateway';
import { BlockchainService } from './blockchain.service';

@Module({
  providers: [BlockchainService, EnergySupplyGateway],
  exports: [BlockchainService, EnergySupplyGateway],
})
export class BlockchainModule {}

