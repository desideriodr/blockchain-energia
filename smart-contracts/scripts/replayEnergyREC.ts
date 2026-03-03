/* Verifica los registros de EnergyREC en la blockchain
 * npx hardhat run scripts/replayEnergyREC.ts --network hardhatMainnet
 */

import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ENV = path.resolve(__dirname, "../../backend/.env");

// Leer .env del backend manualmente
if (fs.existsSync(BACKEND_ENV)) {
  const lines = fs.readFileSync(BACKEND_ENV, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (line.includes("ENERGY_REC")) console.log("DEBUG LINE:", JSON.stringify(line));
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} else {
  console.warn("WARN: .env no encontrado en:", BACKEND_ENV);
}
console.log("DEBUG __dirname:", __dirname);
console.log("DEBUG ENERGY_REC:", process.env.ENERGY_REC_CONTRACT_ADDRESS);

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  const recAddress = process.env.ENERGY_REC_CONTRACT_ADDRESS;
  if (!recAddress) throw new Error("ENERGY_REC_CONTRACT_ADDRESS not defined");

  const artifact = await hre.artifacts.readArtifact("EnergyREC");
  const iface = new ethers.Interface(artifact.abi);
  const contract = new ethers.Contract(recAddress, artifact.abi, provider);

  console.log("=== EnergyREC CONTRACT ===");
  console.log("Direccion:", recAddress);
  console.log("Nombre:   ", await contract.name());
  console.log("Simbolo:  ", await contract.symbol());
  console.log("Oracle:   ", await contract.oracle());
  console.log("Total supply:", (await contract.totalSupply()).toString(), "unidades (x10^4 kWh)");

  const logsRaw = await provider.getLogs({
    address: recAddress,
    fromBlock: 0,
    toBlock: "latest",
  });

  console.log(`\nTotal de eventos encontrados: ${logsRaw.length}`);

  const mints: any[] = [];
  const burns: any[] = [];

  for (const log of logsRaw) {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;

      const entry: any = {
        bloque: log.blockNumber,
        txHash: log.transactionHash,
        args: {} as Record<string, any>,
      };

      parsed.fragment.inputs.forEach((input, i) => {
        const val = parsed.args[i];
        entry.args[input.name] = typeof val === "bigint" ? val.toString() : val;
      });

      if (parsed.name === "RECMinted") mints.push(entry);
      if (parsed.name === "RECBurned") burns.push(entry);
    } catch {
      // ignorar
    }
  }

  // MINTS
  console.log(`\n=== RECMinted - Producciones certificadas (${mints.length}) ===`);
  if (mints.length === 0) {
    console.log("Sin registros aun.");
  } else {
    for (const m of mints) {
      const kwh = (Number(m.args.kwhAmount) / 10_000).toFixed(4);
      const fecha = new Date(Number(m.args.timestamp) * 1000).toLocaleString();
      console.log(`\n  Bloque:    ${m.bloque}`);
      console.log(`  Tx:        ${m.txHash}`);
      console.log(`  Productor: ${m.args.producer}`);
      console.log(`  Fuente:    ${m.args.sourceType}`);
      console.log(`  kWh:       ${kwh}`);
      console.log(`  Fecha:     ${fecha}`);
    }
  }

  // BURNS
  console.log(`\n=== RECBurned - Consumos certificados (${burns.length}) ===`);
  if (burns.length === 0) {
    console.log("Sin registros aun.");
  } else {
    for (const b of burns) {
      const kwh = (Number(b.args.kwhAmount) / 10_000).toFixed(4);
      const fecha = new Date(Number(b.args.timestamp) * 1000).toLocaleString();
      console.log(`\n  Bloque:    ${b.bloque}`);
      console.log(`  Tx:        ${b.txHash}`);
      console.log(`  Consumidor: ${b.args.consumer}`);
      console.log(`  Contrato:  ${b.args.contractAddress}`);
      console.log(`  kWh:       ${kwh}`);
      console.log(`  Fecha:     ${fecha}`);
    }
  }

  // BALANCES
  const addresses = new Set<string>([
    ...mints.map((m) => m.args.producer),
    ...burns.map((b) => b.args.consumer),
  ]);

  if (addresses.size > 0) {
    console.log("\n=== Balances REC actuales por direccion ===");
    for (const addr of addresses) {
      const balance = await contract.balanceOf(addr);
      const kwh = (Number(balance) / 10_000).toFixed(4);
      console.log(`  ${addr} -> ${kwh} kWh en RECs`);
    }
  }

  console.log("\nVerificacion completa.");
}

main().catch(console.error);
