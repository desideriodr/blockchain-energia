import { Module } from '@nestjs/common';

import { EnergySupplyGateway } from './energy-supply.gateway';
import { BlockchainService } from './blockchain.service';
import { ENERGY_CONTRACT_BLOCKCHAIN_PORT } from './ports/energy-contracts-blockchain.port';

@Module({
  providers: [
    BlockchainService,
    EnergySupplyGateway,
    {
      provide: ENERGY_CONTRACT_BLOCKCHAIN_PORT, // Adaptador concreto registrado bajo el token del puerto.
      useExisting: BlockchainService,
    },
  ],
  exports: [
    ENERGY_CONTRACT_BLOCKCHAIN_PORT,
    BlockchainService,
    EnergySupplyGateway
  ],
})
export class BlockchainModule { }

