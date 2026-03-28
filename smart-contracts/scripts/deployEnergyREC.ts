/* Deploy EnergyREC — Renewable Energy Certificate
 *
 * Local:
 *   npx hardhat run scripts/deployEnergyREC.ts --network hardhatMainnet
 *
 * Sepolia:
 *   npx hardhat run scripts/deployEnergyREC.ts --network sepolia
 *
 * Variables requeridas en smart-contracts/.env:
 *   SEPOLIA_RPC_URL      — endpoint Alchemy: https://eth-sepolia.g.alchemy.com/v2/<KEY>
 *   SEPOLIA_PRIVATE_KEY  — clave privada del deployer (0x...)
 *   PLATFORM_WALLET      — direccion publica del oracle/backend
 */

import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ENV = path.resolve(__dirname, "../../backend/.env");

function updateEnv(envPath: string, key: string, value: string): void {
  if (!fs.existsSync(envPath)) {
    console.warn(`WARN: backend/.env no encontrado en ${envPath}`);
    console.warn(`      Agrega manualmente: ${key}=${value}`);
    return;
  }
  let content = fs.readFileSync(envPath, "utf8");
  const regex = new RegExp(`^${key}=.*$`, "m");
  content = regex.test(content)
    ? content.replace(regex, `${key}=${value}`)
    : content + `\n${key}=${value}`;
  fs.writeFileSync(envPath, content, "utf8");
}

async function main(): Promise<void> {
  // Determinar red activa desde el argumento --network
  const networkName = hre.network?.name ?? "desconocida";
  console.log(`\nRed activa       : ${networkName}`);

  // Construir provider y signer directamente desde las variables de entorno
  const rpcUrl     = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

  if (!rpcUrl)     throw new Error("SEPOLIA_RPC_URL no definida en .env");
  if (!privateKey) throw new Error("SEPOLIA_PRIVATE_KEY no definida en .env");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log(`Deployer         : ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`Balance deployer : ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error(
      "La wallet del deployer no tiene ETH.\n" +
        "Sepolia faucet: https://sepoliafaucet.com  |  https://faucet.alchemy.com"
    );
  }

  const oracleAddress: string = process.env.PLATFORM_WALLET ?? deployer.address;
  console.log(`Oracle (backend) : ${oracleAddress}`);

  // Leer artifact compilado por Hardhat
  const artifact = await hre.artifacts.readArtifact("EnergyREC");
  const factory  = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  console.log("\nDeployando EnergyREC...");
  const rec = await factory.deploy(oracleAddress);
  await rec.waitForDeployment();

  const address = await rec.getAddress();
  console.log(`\nEnergyREC address: ${address}`);
  console.log(`Explorer         : https://sepolia.etherscan.io/address/${address}`);

  updateEnv(BACKEND_ENV, "ENERGY_REC_CONTRACT_ADDRESS", address);
  console.log(`\nbackend/.env actualizado con ENERGY_REC_CONTRACT_ADDRESS`);
  console.log("Reinicia el backend para que tome el nuevo valor.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
