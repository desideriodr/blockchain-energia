import { Injectable, OnModuleInit } from "@nestjs/common";
import { ethers } from "ethers";
import * as energyArtifact from "../../../../smart-contracts/artifacts/contracts/EnergySupplyContract.sol/EnergySupplyContract.json";

@Injectable()
export class EnergySupplyGateway implements OnModuleInit {

  private provider!: ethers.JsonRpcProvider;

  async onModuleInit() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC;

    if (!rpcUrl) {
      throw new Error("BLOCKCHAIN_RPC not defined");
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  listenToContract(contractAddress: string) {
    const contract = new ethers.Contract(
      contractAddress,
      energyArtifact.abi,
      this.provider,
    );

    contract.on("ConsumptionReported", (kwh, cost, event) => {
      console.log("Energy consumption reported:", {
        contract: contractAddress,
        kwh: kwh.toString(),
        cost: cost.toString(),
        txHash: event.log.transactionHash,
      });
    });
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}
