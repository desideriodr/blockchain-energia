import { expect } from "chai";
import hre from "hardhat";

const getEthers = () => (hre as any).ethers ?? (hre.network as any).ethers;

describe("EnergySupplyContract", function () {
  let contract: any;
  let owner: any;
  let buyer: any;
  let seller: any;
  let oracle: any;
  let other: any;

  const PRICE_PER_KWH = 500n;
  let start: bigint;
  let end: bigint;

  beforeEach(async function () {
    const ethers = getEthers();
    [owner, buyer, seller, oracle, other] = await ethers.getSigners();

    const now = BigInt(Math.floor(Date.now() / 1000));
    start = now;
    end = now + BigInt(30 * 24 * 60 * 60);

    const EnergySupplyContract = await ethers.getContractFactory("EnergySupplyContract");
    contract = await EnergySupplyContract.deploy(
      buyer.address,
      seller.address,
      oracle.address,
      PRICE_PER_KWH,
      start,
      end,
    );
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("estado inicial = CREATED", async function () {
      expect(await contract.state()).to.equal(0n);
    });

    it("buyer, seller y oracle correctos", async function () {
      expect(await contract.buyer()).to.equal(buyer.address);
      expect(await contract.seller()).to.equal(seller.address);
      expect(await contract.oracle()).to.equal(oracle.address);
    });

    it("precio por kWh correcto", async function () {
      expect(await contract.pricePerKwhCop()).to.equal(PRICE_PER_KWH);
    });

    it("consumedKwh inicial = 0", async function () {
      expect(await contract.consumedKwh()).to.equal(0n);
    });
  });

  describe("activate()", function () {
    it("oracle activa el contrato", async function () {
      await contract.connect(oracle).activate();
      expect(await contract.state()).to.equal(1n);
    });

    it("emite evento ContractActivated", async function () {
      await expect(contract.connect(oracle).activate())
        .to.emit(contract, "ContractActivated");
    });

    it("falla si no es oracle", async function () {
      await expect(contract.connect(other).activate())
        .to.be.revertedWith("Only oracle");
    });

    it("falla si se activa dos veces", async function () {
      await contract.connect(oracle).activate();
      await expect(contract.connect(oracle).activate())
        .to.be.revertedWith("Invalid state");
    });
  });

  describe("reportConsumption()", function () {
    beforeEach(async function () {
      await contract.connect(oracle).activate();
    });

    it("registra consumo correctamente", async function () {
      await contract.connect(oracle).reportConsumption(50n);
      expect(await contract.consumedKwh()).to.equal(50n);
    });

    it("acumula consumos", async function () {
      await contract.connect(oracle).reportConsumption(30n);
      await contract.connect(oracle).reportConsumption(20n);
      expect(await contract.consumedKwh()).to.equal(50n);
    });

    it("emite evento ConsumptionReported", async function () {
      await expect(contract.connect(oracle).reportConsumption(50n))
        .to.emit(contract, "ConsumptionReported")
        .withArgs(50n, 50n);
    });

    it("falla antes de activar", async function () {
      const ethers = getEthers();
      const EnergySupplyContract = await ethers.getContractFactory("EnergySupplyContract");
      const fresh = await EnergySupplyContract.deploy(
        buyer.address, seller.address, oracle.address,
        PRICE_PER_KWH, start, end
      );
      await expect(fresh.connect(oracle).reportConsumption(10n))
        .to.be.revertedWith("Invalid state");
    });
  });

  describe("suspend() / resume()", function () {
    beforeEach(async function () {
      await contract.connect(oracle).activate();
    });

    it("suspende con motivo", async function () {
      await contract.connect(oracle).suspend("Fondos insuficientes");
      expect(await contract.state()).to.equal(2n);
      expect(await contract.suspensionReason()).to.equal("Fondos insuficientes");
    });

    it("reactiva contrato suspendido", async function () {
      await contract.connect(oracle).suspend("motivo");
      await contract.connect(oracle).resume();
      expect(await contract.state()).to.equal(1n);
    });

    it("falla suspender sin motivo", async function () {
      await expect(contract.connect(oracle).suspend(""))
        .to.be.revertedWith("Reason required");
    });
  });

  describe("cancel()", function () {
    beforeEach(async function () {
      await contract.connect(oracle).activate();
    });

    it("cancela contrato activo", async function () {
      await contract.connect(oracle).cancel("Cancelado por comprador");
      expect(await contract.state()).to.equal(3n);
      expect(await contract.terminationReason()).to.equal("Cancelado por comprador");
    });

    it("falla cancelar antes de activar", async function () {
      const ethers = getEthers();
      const EnergySupplyContract = await ethers.getContractFactory("EnergySupplyContract");
      const fresh = await EnergySupplyContract.deploy(
        buyer.address, seller.address, oracle.address,
        PRICE_PER_KWH, start, end
      );
      await expect(fresh.connect(oracle).cancel("motivo"))
        .to.be.revertedWith("Invalid state");
    });
  });

  describe("terminateByExpiration()", function () {
    it("termina contrato vencido", async function () {
      const ethers = getEthers();
      await contract.connect(oracle).activate();

      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(oracle).terminateByExpiration();
      expect(await contract.state()).to.equal(4n);
    });

    it("falla si no ha vencido", async function () {
      await contract.connect(oracle).activate();
      await expect(contract.connect(oracle).terminateByExpiration())
        .to.be.revertedWith("Not expired");
    });
  });

  describe("complete()", function () {
    it("completa contrato activo", async function () {
      await contract.connect(oracle).activate();
      await contract.connect(oracle).reportConsumption(100n);
      await contract.connect(oracle).complete();

      expect(await contract.state()).to.equal(5n);
      expect(await contract.totalAmountCop()).to.equal(100n * PRICE_PER_KWH);
    });

    it("emite evento ContractCompleted", async function () {
      await contract.connect(oracle).activate();
      await contract.connect(oracle).reportConsumption(100n);

      await expect(contract.connect(oracle).complete())
        .to.emit(contract, "ContractCompleted")
        .withArgs(100n);
    });
  });
});