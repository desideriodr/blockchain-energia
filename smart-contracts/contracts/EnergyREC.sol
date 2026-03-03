// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * EnergyREC — Renewable Energy Certificate
 *
 * Token ERC-20 que certifica la producción de energía renovable.
 * Cada token representa 1 kWh producido desde una fuente renovable.
 *
 * Solo el oráculo (oracle) puede emitir y quemar tokens.
 * El balance de tokens de un prosumidor es su certificado de
 * energía renovable producida y no consumida.
 *
 * Flujo:
 *   Producción  → mint()  → prosumidor recibe RECs
 *   Consumo     → burn()  → RECs se queman (energía fue usada)
 *
 * Eventos on-chain permiten auditar toda la trazabilidad:
 *   RECMinted(producer, sourceType, kwhAmount, timestamp)
 *   RECBurned(consumer, contractAddress, kwhAmount, timestamp)
 */
contract EnergyREC is ERC20, Ownable {

    address public oracle;

    // ── Eventos de trazabilidad ──────────────────────────────

    event RECMinted(
        address indexed producer,
        string  sourceType,
        uint256 kwhAmount,
        uint256 timestamp
    );

    event RECBurned(
        address indexed consumer,
        address indexed contractAddress,
        uint256 kwhAmount,
        uint256 timestamp
    );

    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    // ── Modificadores ────────────────────────────────────────

    modifier onlyOracle() {
        require(msg.sender == oracle, "EnergyREC: only oracle");
        _;
    }

    // ── Constructor ──────────────────────────────────────────

    /**
     * @param _oracle direccion del backend que firma transacciones
     */
    constructor(address _oracle) ERC20("Energy REC", "REC") Ownable(msg.sender) {
        require(_oracle != address(0), "EnergyREC: oracle is zero address");
        oracle = _oracle;
    }

    // ── Funciones principales ────────────────────────────────

    /**
     * Emite RECs al productor cuando genera energia renovable.
     *
     * @param producer   direccion del productor (wallet del usuario)
     * @param sourceType tipo de fuente: SOLAR, EOLICA, HIDRO, BIOMASA
     * @param kwhAmount  cantidad de kWh con 4 decimales (x10^4)
     */
    function mint(
        address producer,
        string calldata sourceType,
        uint256 kwhAmount
    ) external onlyOracle {
        require(producer != address(0), "EnergyREC: producer is zero address");
        require(kwhAmount > 0, "EnergyREC: amount must be greater than 0");

        _mint(producer, kwhAmount);

        emit RECMinted(producer, sourceType, kwhAmount, block.timestamp);
    }

    /**
     * Quema RECs del consumidor cuando consume energia certificada.
     *
     * @param consumer        direccion del consumidor (wallet del comprador)
     * @param contractAddress direccion del contrato P2P asociado
     * @param kwhAmount       cantidad de kWh consumidos con 4 decimales (x10^4)
     */
    function burn(
        address consumer,
        address contractAddress,
        uint256 kwhAmount
    ) external onlyOracle {
        require(consumer != address(0), "EnergyREC: consumer is zero address");
        require(kwhAmount > 0, "EnergyREC: amount must be greater than 0");
        require(
            balanceOf(consumer) >= kwhAmount,
            "EnergyREC: insufficient REC balance"
        );

        _burn(consumer, kwhAmount);

        emit RECBurned(consumer, contractAddress, kwhAmount, block.timestamp);
    }

    /**
     * Actualiza el oráculo. Solo el owner puede hacerlo.
     * Util para rotacion de claves sin redesplegar el contrato.
     */
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "EnergyREC: new oracle is zero address");
        emit OracleUpdated(oracle, newOracle);
        oracle = newOracle;
    }

    /**
     * Retorna los decimales del token.
     * Usamos 4 para que 1 REC = 1 kWh con precision de 0.0001 kWh
     */
    function decimals() public pure override returns (uint8) {
        return 4;
    }
}