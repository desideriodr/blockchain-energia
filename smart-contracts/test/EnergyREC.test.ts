import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "ethers";

const ONE_KWH  = parseUnits("1", 4);
const HALF_KWH = parseUnits("0.5", 4);

describe("EnergyREC", function () {
  let rec: any;
  let owner: any;
  let oracle: any;
  let producer: any;
  let consumer: any;
  let other: any;

  // En Hardhat 3 ethers vive en la conexión de red
  const getEthers = () => (hre as any).ethers ?? (hre.network as any).ethers;

  beforeEach(async function () {
    const ethers = getEthers();
    [owner, oracle, producer, consumer, other] = await ethers.getSigners();
    const EnergyREC = await ethers.getContractFactory("EnergyREC");
    rec = await EnergyREC.deploy(oracle.address);
    await rec.waitForDeployment();
  });

  // ── Deployment ─────────────────────────────────────────────

  describe("Deployment", function () {
    it("nombre y símbolo correctos", async function () {
      expect(await rec.name()).to.equal("Energy REC");
      expect(await rec.symbol()).to.equal("REC");
    });

    it("decimales = 4", async function () {
      expect(await rec.decimals()).to.equal(4n);
    });

    it("oracle inicializado correctamente", async function () {
      expect(await rec.oracle()).to.equal(oracle.address);
    });

    it("supply inicial = 0", async function () {
      expect(await rec.totalSupply()).to.equal(0n);
    });
  });

  // ── Mint ───────────────────────────────────────────────────

  describe("mint()", function () {
    it("oracle puede emitir RECs", async function () {
      await rec.connect(oracle).mint(producer.address, "SOLAR", ONE_KWH);
      expect(await rec.balanceOf(producer.address)).to.equal(ONE_KWH);
    });

    it("aumenta el totalSupply", async function () {
      await rec.connect(oracle).mint(producer.address, "SOLAR", ONE_KWH);
      await rec.connect(oracle).mint(producer.address, "EOLICA", HALF_KWH);
      expect(await rec.totalSupply()).to.equal(ONE_KWH + HALF_KWH);
    });

    it("emite evento RECMinted", async function () {
      await expect(rec.connect(oracle).mint(producer.address, "SOLAR", ONE_KWH))
        .to.emit(rec, "RECMinted")
        .withArgs(producer.address, "SOLAR", ONE_KWH, await getTimestamp());
    });

    it("falla si no es el oracle", async function () {
      await expect(rec.connect(other).mint(producer.address, "SOLAR", ONE_KWH))
        .to.be.revertedWith("EnergyREC: only oracle");
    });

    it("falla si amount = 0", async function () {
      await expect(rec.connect(oracle).mint(producer.address, "SOLAR", 0n))
        .to.be.revertedWith("EnergyREC: amount must be greater than 0");
    });
  });

  // ── Burn ───────────────────────────────────────────────────

  describe("burn()", function () {
    beforeEach(async function () {
      await rec.connect(oracle).mint(consumer.address, "SOLAR", ONE_KWH);
    });

    it("oracle puede quemar RECs", async function () {
      await rec.connect(oracle).burn(consumer.address, producer.address, HALF_KWH);
      expect(await rec.balanceOf(consumer.address)).to.equal(ONE_KWH - HALF_KWH);
    });

    it("reduce el totalSupply", async function () {
      await rec.connect(oracle).burn(consumer.address, producer.address, ONE_KWH);
      expect(await rec.totalSupply()).to.equal(0n);
    });

    it("emite evento RECBurned", async function () {
      await expect(
        rec.connect(oracle).burn(consumer.address, producer.address, HALF_KWH)
      )
        .to.emit(rec, "RECBurned")
        .withArgs(consumer.address, producer.address, HALF_KWH, await getTimestamp());
    });

    it("falla si no es el oracle", async function () {
      await expect(rec.connect(other).burn(consumer.address, producer.address, HALF_KWH))
        .to.be.revertedWith("EnergyREC: only oracle");
    });

    it("falla si balance insuficiente", async function () {
      const TOO_MUCH = parseUnits("2", 4);
      await expect(rec.connect(oracle).burn(consumer.address, producer.address, TOO_MUCH))
        .to.be.revertedWith("EnergyREC: insufficient REC balance");
    });
  });

  // ── updateOracle ───────────────────────────────────────────

  describe("updateOracle()", function () {
    it("owner puede actualizar el oracle", async function () {
      await rec.connect(owner).updateOracle(other.address);
      expect(await rec.oracle()).to.equal(other.address);
    });

    it("falla si no es el owner", async function () {
      await expect(rec.connect(other).updateOracle(other.address))
        .to.be.revertedWithCustomError(rec, "OwnableUnauthorizedAccount");
    });

    it("falla si nuevo oracle es address cero", async function () {
      await expect(
        rec.connect(owner).updateOracle("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("EnergyREC: new oracle is zero address");
    });
  });
});

async function getTimestamp(): Promise<number> {
  const ethers = (hre as any).ethers ?? (hre.network as any).ethers;
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}