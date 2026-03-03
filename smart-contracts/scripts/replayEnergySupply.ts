/* este script se ejecuta desde la terminal
 * npx hardhat run scripts/replayEnergySupply.ts --network hardhatMainnet
 */

import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // 1. Conectar al proveedor local Hardhat
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // 2. Leer artifact del contrato
  const artifact = await hre.artifacts.readArtifact("EnergySupplyContract");
  const abi = artifact.abi;
  const iface = new ethers.Interface(abi);

  // 3. Obtener todos los logs desde el bloque 0
  const logsRaw = await provider.getLogs({
    fromBlock: 0,
    toBlock: "latest",
  });

  // 4. Detectar automáticamente todas las direcciones de contratos desplegados
  const contractAddresses = new Set<string>();

  for (const log of logsRaw) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed) {
        contractAddresses.add(log.address);
      }
    } catch {
      // ignorar logs que no sean del contrato
    }
  }

  console.log("Contratos detectados:", [...contractAddresses]);

  // 5. Mapeo legible de estados (según enum Solidity)
  const stateEnumMap: Record<number, string> = {
    0: "CREATED",
    1: "ACTIVE",
    2: "SUSPENDED",
    3: "CANCELED",
    4: "TERMINATED",
    5: "COMPLETED",
  };

  // 6. Mapear eventos → estado
  const stateEventMap: Record<string, string> = {
    ContractActivated: "ACTIVE",
    ContractSuspended: "SUSPENDED",
    ContractResumed: "ACTIVE",
    ContractCancelled: "CANCELED",
    ContractCompleted: "COMPLETED",
    ContractTerminated: "TERMINATED",
  };

  // 7. Recorremos cada contrato
  for (const address of contractAddresses) {
    const contract = new ethers.Contract(address, abi, provider);

    // Estado inicial on-chain
    const rawState = Number(await contract.state());

    const initialState = {
      buyer: await contract.buyer(),
      seller: await contract.seller(),
      oracle: await contract.oracle(),
      pricePerKwhCop: (await contract.pricePerKwhCop()).toString(),
      startTimestamp: (await contract.startTimestamp()).toString(),
      endTimestamp: (await contract.endTimestamp()).toString(),
      state: stateEnumMap[rawState] ?? rawState.toString(),
      consumedKwh: (await contract.consumedKwh()).toString(),
    };

    console.log(`\n=== ESTADO INICIAL DEL CONTRATO ${address} ===`);
    console.table(initialState);

    const events: {
      block: number;
      txHash: string;
      event: string;
      args: Record<string, any> | null;
    }[] = [];

    // Filtrar logs solo de este contrato
    for (const log of logsRaw) {
      if (log.address !== address) continue;

      try {
        const parsed = iface.parseLog(log);
        if (!parsed) continue;

        const args: Record<string, any> = {};

        parsed.fragment.inputs.forEach((input, index) => {
          const value = parsed.args[index];
          args[input.name] =
            typeof value === "bigint" ? value.toString() : value;
        });

        events.push({
          block: log.blockNumber,
          txHash: log.transactionHash,
          event: parsed.name,
          args,
        });
      } catch {
        // ignorar logs no relacionados
      }
    }

    // Ordenar por bloque
    events.sort((a, b) => a.block - b.block);

    // Replay
    let currentState = { ...initialState };

    console.log(`\n=== REPLAY DEL CONTRATO ${address} PASO A PASO ===`);

    events.forEach((e, i) => {
      console.log(`\n#${i + 1} Bloque ${e.block} - Evento: ${e.event}`);
      console.log("Tx hash:", e.txHash);
      console.log("Args:", e.args ?? "No args");

      // Actualizar estado por evento
      if (stateEventMap[e.event]) {
        currentState.state = stateEventMap[e.event];
      }

      // Actualizar consumo
      if (e.event === "ConsumptionReported") {
        if (e.args?.totalConsumed) {
          currentState.consumedKwh = e.args.totalConsumed;
        }
      }

      // Motivos
      if (e.event === "ContractSuspended" && e.args?.reason) {
        console.log("Motivo de suspensión:", e.args.reason);
      }

      if (e.event === "ContractCancelled" && e.args?.reason) {
        console.log("Motivo de cancelación:", e.args.reason);
      }

      console.log("Estado actual:", currentState.state);
      console.log("Consumo total actual (kWh):", currentState.consumedKwh);
    });

    // Verificar bytecode
    const bytecode = await provider.getCode(address);

    console.log(`\n=== BYTECODE ACTUAL DEL CONTRATO ${address} ===`);
    console.log(
      bytecode === "0x"
        ? "Contrato no desplegado"
        : "Código presente en la blockchain"
    );
  }
}

main().catch(console.error);