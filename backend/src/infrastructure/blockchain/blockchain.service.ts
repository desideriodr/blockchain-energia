import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers, NonceManager, parseUnits } from 'ethers';
import * as energyArtifact from '../../../../smart-contracts/artifacts/contracts/EnergySupplyContract.sol/EnergySupplyContract.json';
import { IEnergyContractBlockchain } from './ports/energy-contracts-blockchain.port';

/* BlockchainService
 * Arquitectura hexagonal - adaptador
 * se encarga de comunicarse con el servicio de blockchain actual
 * sin depender de el (puerto - adaptador)
 */ 
@Injectable()
export class BlockchainService implements IEnergyContractBlockchain, OnModuleInit {
  private provider!: ethers.JsonRpcProvider;
  private signer!: NonceManager;

  private readonly stateEnumMap: Record<number, string> = {
    0: 'CREATED',
    1: 'ACTIVE',
    2: 'SUSPENDED',
    3: 'CANCELED',
    4: 'TERMINATED',
    5: 'COMPLETED',
  };

  async onModuleInit() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC;
    const privateKey = process.env.PLATFORM_PRIVATE_KEY;

    if (!rpcUrl) throw new Error('BLOCKCHAIN_RPC not defined');
    if (!privateKey) throw new Error('PLATFORM_PRIVATE_KEY not defined');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, this.provider);
    this.signer = new NonceManager(wallet);

    console.log('Blockchain connected');
    console.log('Oracle address:', await this.signer.getAddress());
  }

  /*
   * INTERNAL HELPER - funciones de calculo de valores como comisiones, consumos, etc 
   */
  private getWriteContract(address: string) {
    return new ethers.Contract(address, energyArtifact.abi, this.signer);
  }

  private getReadContract(address: string) {
    return new ethers.Contract(address, energyArtifact.abi, this.provider);
  }

  private async execute(txFactory: () => Promise<any>): Promise<string> {
    const tx = await txFactory();

    if (!tx?.wait) {
      throw new Error("Funcion no retorna una transacción.");
    }
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /*
   * DEPLOY - despligue del contrato inteligente
   */
  async deployEnergyContract(
    buyer: string,
    seller: string,
    pricePerKwhCop: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<string> {
    const factory = new ethers.ContractFactory(
      energyArtifact.abi,
      energyArtifact.bytecode,
      this.signer,
    );

    const contract = await factory.deploy(
      buyer,
      seller,
      await this.signer.getAddress(),
      BigInt(pricePerKwhCop),
      BigInt(startTimestamp),
      BigInt(endTimestamp),
    );

    await contract.waitForDeployment();
    return await contract.getAddress();
  }

  /*
   * LIFECYCLE (WRITE) - funciones que cambian el estado del contrato y registra transacciones 
   */
  async activateContract(contractAddress: string): Promise<string> {
    const contract = this.getWriteContract(contractAddress);
    return this.execute(() => contract.activate());
  }

  async reportConsumption(
    contractAddress: string,
    kwh: string,
  ): Promise<string> {

    const contract = this.getWriteContract(contractAddress);
    const value = parseUnits(kwh, 4); // 4 Decimales

    return this.execute(() => contract.reportConsumption(value));
  }

  async suspendContract(
    contractAddress: string,
    reason: string,
  ): Promise<string> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Suspension reason is required');
    }

    const contract = this.getWriteContract(contractAddress);
    return this.execute(() => contract.suspend(reason));
  }

  async resumeContract(contractAddress: string): Promise<string> {
    const contract = this.getWriteContract(contractAddress);
    return this.execute(() => contract.resume());
  }

  async cancelContract(
    contractAddress: string,
    reason: string,
  ): Promise<string> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }

    const contract = this.getWriteContract(contractAddress);
    return this.execute(() => contract.cancel(reason));
  }

  async completeContract(contractAddress: string): Promise<string> {
    const contract = this.getWriteContract(contractAddress);
    return this.execute(() => contract.complete());
  }

  async terminateByExpiration(
    contractAddress: string,
  ): Promise<string> {
    const contract = this.getWriteContract(contractAddress);
    return this.execute(() => contract.terminateByExpiration());
  }

  /*READ - lee el estado actual del contrato*/
  async getContractState(contractAddress: string) {
    const contract = this.getReadContract(contractAddress);

    const rawState = Number(await contract.state());

    return {
      buyer: await contract.buyer(),
      seller: await contract.seller(),
      pricePerKwhCop: (await contract.pricePerKwhCop()).toString(),
      consumedKwh: (await contract.consumedKwh()).toString(),
      startTimestamp: (await contract.startTimestamp()).toString(),
      endTimestamp: (await contract.endTimestamp()).toString(),
      state: this.stateEnumMap[rawState] ?? rawState,
      totalAmountCop: (await contract.totalAmountCop()).toString(),
    };
  }
}