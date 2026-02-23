import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // 1️⃣ Conectar al proveedor local Hardhat
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // 2️⃣ Leer artifact del contrato
  const artifact = await hre.artifacts.readArtifact("EnergySupplyContract");
  const abi = artifact.abi;

  // 3️⃣ Dirección del contrato desplegado
  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // reemplaza con tu dirección

  const contract = new ethers.Contract(contractAddress, abi, provider);

  // 4️⃣ Estado inicial del constructor
  const initialState = {
    buyer: await contract.buyer(),
    seller: await contract.seller(),
    oracle: await contract.oracle(),
    pricePerKwhCop: (await contract.pricePerKwhCop()).toString(),
    startTimestamp: (await contract.startTimestamp()).toString(),
    endTimestamp: (await contract.endTimestamp()).toString(),
    state: (await contract.state()).toString(),
    consumedKwh: (await contract.consumedKwh()).toString(),
  };

  console.log("\n=== ESTADO INICIAL DEL CONSTRUCTOR ===");
  console.table(initialState);

  // 5️⃣ Obtener todos los eventos relevantes
  const eventTypes = ["ContractActivated", "ContractCancelled", "ContractCompleted", "ConsumptionReported"] as const;

  type EventRecord = {
    block: number;
    txHash: string;
    event: string;
    args: Record<string, any> | null;
  };

  const events: EventRecord[] = [];

  for (const type of eventTypes) {
    const filter = contract.filters[type]();
    const logs = await contract.queryFilter(filter, 0, "latest");

    logs.forEach(log => {
      let args: Record<string, any> | null = null;
      if ("args" in log && log.args) {
        args = Object.fromEntries(Object.entries(log.args));
      }
      events.push({
        block: log.blockNumber,
        txHash: log.transactionHash,
        event: type,
        args,
      });
    });
  }

  // 6️⃣ Ordenar eventos por bloque
  events.sort((a, b) => a.block - b.block);

  // 7️⃣ Replay del estado
  let currentState = { ...initialState };

  console.log("\n=== REPLAY DEL CONTRATO PASO A PASO ===");
  events.forEach((e, i) => {
    console.log(`\n#${i + 1} Bloque ${e.block} - Evento: ${e.event}`);
    console.log("Tx hash:", e.txHash);
    console.log("Args:", e.args ?? "No args");

    // Actualizar estado según evento
    switch (e.event) {
      case "ContractActivated":
        currentState.state = "ACTIVE";
        break;
      case "ContractCancelled":
        currentState.state = "CANCELED";
        break;
      case "ContractCompleted":
        currentState.state = "COMPLETED";
        break;
      case "ConsumptionReported":
        if (e.args && e.args.totalConsumed) {
          currentState.consumedKwh = e.args.totalConsumed.toString();
        }
        break;
      default:
        break;
    }

    console.log("Estado actual:", currentState.state);
    console.log("Consumo total actual (kWh):", currentState.consumedKwh);
  });

  // 8️⃣ Verificar bytecode en la blockchain local
  const bytecode = await provider.getCode(contractAddress);
  console.log("\n=== BYTECODE ACTUAL DEL CONTRATO ===");
  console.log(bytecode === "0x" ? "Contrato no desplegado" : "Código presente en la blockchain");
}

main().catch(console.error);