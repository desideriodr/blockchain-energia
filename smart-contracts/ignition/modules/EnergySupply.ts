import hre from "hardhat";

export default async function ({ deploy }: { deploy: any }) {
  // 1️⃣ Leer el artifact compilado
  const artifact = await hre.artifacts.readArtifact("EnergySupplyContract");

  // 2️⃣ Desplegar el contrato usando Ignition
  const energySupply = await deploy({
    name: "EnergySupplyContract",
    artifact,
    args: [], // si tu constructor recibe parámetros, agrégalos aquí
  });

  console.log("EnergySupplyContract desplegado en:", energySupply.address);
}