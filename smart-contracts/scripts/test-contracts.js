// scripts/test-contracts.js
// Ejecutar: npx hardhat run scripts/test-contracts.js --network localhost

async function main() {
  // 1️⃣ Import dinámico del HRE
  const hre = await import("hardhat");
  const ethers = hre.ethers;

  // 2️⃣ Obtén los signers
  const [signer] = await ethers.getSigners();

  // 3️⃣ Carga la dirección desplegada desde Ignition
  const deployed = await import("../ignition/deployments/chain-31337/deployed_addresses.json", { assert: { type: "json" } });
  const address = deployed.default["EnergyTokenModule#EnergyToken"];

  // 4️⃣ Carga el artifact (escapando # como %23)
  const artifact = await import("../ignition/deployments/chain-31337/artifacts/EnergyTokenModule%23EnergyToken.json", { assert: { type: "json" } });

  // 5️⃣ Crea la instancia del contrato con el signer
  const contract = new ethers.Contract(address, artifact.default.abi, signer);

  // 6️⃣ Llama funciones
  const tx1 = await contract.produceEnergy(100);
  await tx1.wait();

  const tx2 = await contract.transferEnergy("0xOTRA_DIRECCION", 50);
  await tx2.wait();

  // 7️⃣ Verifica
  console.log("Contrato listo en:", address);
  const totalSupply = await contract.totalSupply();
  console.log("Total Supply:", totalSupply.toString());
}

main().catch(console.error);
