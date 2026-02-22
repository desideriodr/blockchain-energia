import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers, NonceManager } from 'ethers';
import * as energyArtifact from '../../../../smart-contracts/artifacts/contracts/EnergySupplyContract.sol/EnergySupplyContract.json';

// ollama pull sam860/qwen3-reranker:0.6b


@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider!: ethers.JsonRpcProvider;
  private signer!: NonceManager; // Backend = ORACLE

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

  /* ================= DEPLOY ================= */

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

  /* ================= LIFECYCLE ================= */

  async activateContract(contractAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.signer,
    );

    const tx = await contract.activate();
    await tx.wait();

    return tx.hash;
  }

  async reportConsumption(
    contractAddress: string,
    kwh: string,
  ): Promise<string> {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.signer,
    );

    const tx = await contract.reportConsumption(BigInt(kwh));
    await tx.wait();

    return tx.hash;
  }

  async cancelContract(contractAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.signer,
    );

    const tx = await contract.cancel();
    await tx.wait();

    return tx.hash;
  }

  async completeContract(contractAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.signer,
    );

    const tx = await contract.complete();
    await tx.wait();
    return tx.hash;
  }

  async terminateContract(contractAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.signer,
    );

    const tx = await contract.terminate();
    await tx.wait();
    return tx.hash;
  }

  /* ================= READ ================= */

  async getContractState(contractAddress: string) {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.provider,
    );

    return {
      buyer: await contract.buyer(),
      seller: await contract.seller(),
      pricePerKwhCop: (await contract.pricePerKwhCop()).toString(),
      consumedKwh: (await contract.consumedKwh()).toString(),
      state: Number(await contract.state()),
      totalAmountCop: (await contract.totalAmountCop()).toString(),
    };
  }
}
