/* Verifica y reproduce los registros on-chain de EnergyREC
 *
 * Local:
 *   npx hardhat run scripts/replayEnergyREC.ts --network hardhatMainnet
 *
 * Sepolia:
 *   npx hardhat run scripts/replayEnergyREC.ts --network sepolia
 */

import { ethers, network, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ENV = path.resolve(__dirname, "../../backend/.env");

function loadBackendEnv(): void {
  if (!fs.existsSync(BACKEND_ENV)) {
    console.warn(`WARN: backend/.env no encontrado en ${BACKEND_ENV}`);
    return;
  }
  const lines = fs.readFileSync(BACKEND_ENV, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

interface EventEntry {
  bloque: number;
  txHash: string;
  args: Record<string, string>;
}

async function main(): Promise<void> {
  loadBackendEnv();

  console.log(`\nRed activa: ${network.name}`);

  const provider = ethers.provider;

  const recAddress = process.env.ENERGY_REC_CONTRACT_ADDRESS;
  if (!recAddress) {
    throw new Error(
      "ENERGY_REC_CONTRACT_ADDRESS no definida.\n" +
        "Ejecuta primero: npx hardhat run scripts/deployEnergyREC.ts --network " + network.name
    );
  }

  const artifact = await artifacts.readArtifact("EnergyREC");
  const iface    = new ethers.Interface(artifact.abi);
  const contract = new ethers.Contract(recAddress, artifact.abi, provider);

  console.log("\n=== EnergyREC CONTRACT ===");
  console.log(`Direccion    : ${recAddress}`);
  console.log(`Nombre       : ${await contract.name()}`);
  console.log(`Simbolo      : ${await contract.symbol()}`);
  console.log(`Oracle       : ${await contract.oracle()}`);
  console.log(`Total supply : ${(await contract.totalSupply()).toString()} unidades (x10^4 kWh)`);

  const logsRaw = await provider.getLogs({
    address: recAddress,
    fromBlock: 0,
    toBlock: "latest",
  });

  console.log(`\nTotal eventos encontrados: ${logsRaw.length}`);

  const mints: EventEntry[] = [];
  const burns: EventEntry[] = [];

  for (const log of logsRaw) {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;

      const entry: EventEntry = {
        bloque: log.blockNumber,
        txHash: log.transactionHash,
        args:   {},
      };

      parsed.fragment.inputs.forEach((input, i) => {
        const val = parsed.args[i];
        entry.args[input.name] = typeof val === "bigint" ? val.toString() : String(val);
      });

      if (parsed.name === "RECMinted") mints.push(entry);
      if (parsed.name === "RECBurned") burns.push(entry);
    } catch {
      // log no reconocido — ignorar
    }
  }

  console.log(`\n=== RECMinted — Producciones certificadas (${mints.length}) ===`);
  if (mints.length === 0) {
    console.log("Sin registros aun.");
  } else {
    for (const entry of mints) {
      const kwh   = (Number(entry.args.kwhAmount) / 10_000).toFixed(4);
      const fecha = new Date(Number(entry.args.timestamp) * 1000).toLocaleString();
      console.log(`\n  Bloque    : ${entry.bloque}`);
      console.log(`  Tx        : ${entry.txHash}`);
      console.log(`  Productor : ${entry.args.producer}`);
      console.log(`  Fuente    : ${entry.args.sourceType}`);
      console.log(`  kWh       : ${kwh}`);
      console.log(`  Fecha     : ${fecha}`);
    }
  }

  console.log(`\n=== RECBurned — Consumos certificados (${burns.length}) ===`);
  if (burns.length === 0) {
    console.log("Sin registros aun.");
  } else {
    for (const entry of burns) {
      const kwh   = (Number(entry.args.kwhAmount) / 10_000).toFixed(4);
      const fecha = new Date(Number(entry.args.timestamp) * 1000).toLocaleString();
      console.log(`\n  Bloque    : ${entry.bloque}`);
      console.log(`  Tx        : ${entry.txHash}`);
      console.log(`  Consumidor: ${entry.args.consumer}`);
      console.log(`  Contrato  : ${entry.args.contractAddress}`);
      console.log(`  kWh       : ${kwh}`);
      console.log(`  Fecha     : ${fecha}`);
    }
  }

  const addresses = new Set<string>([
    ...mints.map((e) => e.args.producer),
    ...burns.map((e) => e.args.consumer),
  ]);

  if (addresses.size > 0) {
    console.log("\n=== Balances REC actuales por direccion ===");
    for (const addr of addresses) {
      const balance = await contract.balanceOf(addr);
      const kwh     = (Number(balance) / 10_000).toFixed(4);
      console.log(`  ${addr}  ->  ${kwh} kWh en RECs`);
    }
  }

  console.log("\nVerificacion completa.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
