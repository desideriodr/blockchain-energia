// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract EnergySupplyContract {

    enum ContractState {
        CREATED,
        ACTIVE,
        SUSPENDED,
        CANCELED,
        TERMINATED,   // fin natural por vencimiento
        COMPLETED
    }

    address public immutable buyer;
    address public immutable seller;
    address public immutable oracle;

    uint256 public immutable pricePerKwhCop;
    uint256 public consumedKwh;

    uint256 public immutable startTimestamp;
    uint256 public immutable endTimestamp;

    string public sourceType; // tipo de fuente: SOLAR, EOLICA, HIDRO, BIOMASA

    ContractState public state;

    string public terminationReason;
    string public suspensionReason;

    // ================= EVENTS =================

    event ContractActivated();
    event ConsumptionReported(uint256 kwh, uint256 totalConsumed);
    event ContractSuspended(string reason);
    event ContractResumed();
    event ContractCancelled(string reason);
    event ContractTerminated(); // vencimiento natural
    event ContractCompleted(uint256 totalConsumed);

    // ================= MODIFIERS =================

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }

    modifier inState(ContractState _state) {
        require(state == _state, "Invalid state");
        _;
    }

    modifier onlyDuringActivePeriod() {
        require(
            block.timestamp >= startTimestamp &&
            block.timestamp <= endTimestamp,
            "Outside contract period"
        );
        _;
    }

    // ================= CONSTRUCTOR =================

    constructor(
        address _buyer,
        address _seller,
        address _oracle,
        uint256 _pricePerKwhCop,
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        string memory _sourceType
    ) {
        require(_endTimestamp > _startTimestamp, "Invalid time range");
        require(bytes(_sourceType).length > 0, "Source type required");

        buyer = _buyer;
        seller = _seller;
        oracle = _oracle;

        pricePerKwhCop = _pricePerKwhCop;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        sourceType = _sourceType;

        state = ContractState.CREATED;
    }

    // ================= STATE TRANSITIONS =================

    function activate()
        external
        onlyOracle
        inState(ContractState.CREATED)
    {
        state = ContractState.ACTIVE;
        emit ContractActivated();
    }

    function reportConsumption(uint256 kwh)
        external
        onlyOracle
        inState(ContractState.ACTIVE)
        onlyDuringActivePeriod
    {
        require(kwh > 0, "Invalid kwh");

        consumedKwh += kwh;

        emit ConsumptionReported(kwh, consumedKwh);
    }

    // ================= SUSPENSION =================

    function suspend(string memory reason)
        external
        onlyOracle
        inState(ContractState.ACTIVE)
    {
        require(bytes(reason).length > 0, "Reason required");

        state = ContractState.SUSPENDED;
        suspensionReason = reason;

        emit ContractSuspended(reason);
    }

    function resume()
        external
        onlyOracle
        inState(ContractState.SUSPENDED)
    {
        suspensionReason = "";
        state = ContractState.ACTIVE;

        emit ContractResumed();
    }

    // ================= VOLUNTARY CANCELLATION =================

    function cancel(string memory reason)
        external
        onlyOracle
        inState(ContractState.ACTIVE)
    {
        require(bytes(reason).length > 0, "Reason required");

        state = ContractState.CANCELED;
        terminationReason = reason;

        emit ContractCancelled(reason);
    }

    // ================= NATURAL TERMINATION =================

    function terminateByExpiration()
        external
        onlyOracle
        inState(ContractState.ACTIVE)
    {
        require(block.timestamp > endTimestamp, "Not expired");

        state = ContractState.TERMINATED;

        emit ContractTerminated();
    }

    // ================= COMPLETION =================

    function complete()
        external
        onlyOracle
        inState(ContractState.ACTIVE)
    {
        require(block.timestamp <= endTimestamp, "Already expired");

        state = ContractState.COMPLETED;

        emit ContractCompleted(consumedKwh);
    }

    // ================= VIEW =================

    function totalAmountCop() public view returns (uint256) {
        return consumedKwh * pricePerKwhCop;
    }
}