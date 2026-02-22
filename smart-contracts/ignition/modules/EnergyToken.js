import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EnergyTokenModule", (m) => {
  const energyToken = m.contract("EnergyToken");

  return { energyToken };
});