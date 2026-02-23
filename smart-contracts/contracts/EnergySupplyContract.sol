// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract EnergySupplyContract {
    enum ContractState {
        CREATED,
        ACTIVE,
        COMPLETED,
        TERMINATED,
        CANCELED
    }

    address public buyer;
    address public seller;
    address public oracle;

    uint256 public pricePerKwhCop;
    uint256 public consumedKwh;

    uint256 public startTimestamp;
    uint256 public endTimestamp;

    ContractState public state;

    event ContractActivated();
    event ConsumptionReported(uint256 kwh, uint256 totalConsumed);
    event ContractCompleted(uint256 totalConsumed);
    event ContractCancelled();

    modifier onlyOracle() {
        require(msg.sender == oracle, "Solo backend");
        _;
    }

    modifier inState(ContractState _state) {
        require(state == _state, "Estado invalido");
        _;
    }

    constructor(
        address _buyer,
        address _seller,
        address _oracle,
        uint256 _pricePerKwhCop,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) {
        require(_endTimestamp > _startTimestamp, "Rango invalido");

        buyer = _buyer;
        seller = _seller;
        oracle = _oracle;

        pricePerKwhCop = _pricePerKwhCop;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;

        state = ContractState.CREATED;
    }

    function activate() external onlyOracle inState(ContractState.CREATED) {
        state = ContractState.ACTIVE;
        emit ContractActivated();
    }

    function reportConsumption(
        uint256 kwh
    ) external onlyOracle inState(ContractState.ACTIVE) {
        consumedKwh += kwh;
        emit ConsumptionReported(kwh, consumedKwh);
    }

    function complete() external onlyOracle inState(ContractState.ACTIVE) {
        state = ContractState.COMPLETED;
        emit ContractCompleted(consumedKwh);
    }

    function cancel() external onlyOracle inState(ContractState.ACTIVE) {
        state = ContractState.CANCELED;
        emit ContractCancelled();
    }

    function terminate() external onlyOracle inState(ContractState.ACTIVE) {
        state = ContractState.TERMINATED;
        emit ContractCancelled();
    }

    function totalAmountCop() public view returns (uint256) {
        return consumedKwh * pricePerKwhCop;
    }
}
