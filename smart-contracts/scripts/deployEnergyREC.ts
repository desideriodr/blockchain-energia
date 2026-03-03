/* Deploy EnergyREC — Renewable Energy Certificate
 * PLATFORM_PRIVATE_KEY=0x... npx hardhat run scripts/deployEnergyREC.ts --network hardhatMainnet
 *
 * Despliega el contrato y actualiza automáticamente ENERGY_REC_CONTRACT_ADDRESS
 * en el .env del backend.
 */

import hre from "hardhat";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ENV = path.resolve(__dirname, "../../backend/.env");

function updateEnv(envPath: string, key: string, value: string): void {
  let content = fs.readFileSync(envPath, "utf8");
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(envPath, content, "utf8");
}

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  const privateKey = process.env.PLATFORM_PRIVATE_KEY;
  if (!privateKey) throw new Error("PLATFORM_PRIVATE_KEY not defined");

  const deployer = new ethers.Wallet(privateKey, provider);
  console.log("Desplegando con cuenta:", deployer.address);

  const artifact = await hre.artifacts.readArtifact("EnergyREC");

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer,
  );

  const rec = await factory.deploy(deployer.address);
  await rec.waitForDeployment();

  const address = await rec.getAddress();

  console.log("EnergyREC desplegado en:", address);

  // Actualizar .env del backend automáticamente
  updateEnv(BACKEND_ENV, "ENERGY_REC_CONTRACT_ADDRESS", address);
  console.log(`\n ENERGY_REC_CONTRACT_ADDRESS actualizado en ${BACKEND_ENV}`);
  console.log("Reinicia el backend para que tome el nuevo valor.");
}

main().catch(console.error);
