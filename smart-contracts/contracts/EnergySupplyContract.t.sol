// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/EnergySupplyContract.sol";

contract EnergySupplyContractTest is Test {

    EnergySupplyContract contractInstance;

    address buyer = address(0x1);
    address seller = address(0x2);
    address oracle = address(this); // el test actúa como backend

    uint256 pricePerKwh = 500; // 500 COP

    uint256 start;
    uint256 end;

    function setUp() public {
        start = block.timestamp;
        end = block.timestamp + 30 days;

        contractInstance = new EnergySupplyContract(
            buyer,
            seller,
            oracle,
            pricePerKwh,
            start,
            end
        );
    }

    /* ---------------------------------------------------------- */
    /*                      INITIAL STATE                         */
    /* ---------------------------------------------------------- */

    function testInitialState() public view {
        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.CREATED)
        );
    }

    /* ---------------------------------------------------------- */
    /*                      ACTIVATE                              */
    /* ---------------------------------------------------------- */

    function testActivateContract() public {
        contractInstance.activate();

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.ACTIVE)
        );
    }

    /* ---------------------------------------------------------- */
    /*                  REPORT CONSUMPTION                        */
    /* ---------------------------------------------------------- */

    function testReportConsumption() public {
        contractInstance.activate();
        contractInstance.reportConsumption(50);

        assertEq(contractInstance.consumedKwh(), 50);
    }

    /* ---------------------------------------------------------- */
    /*                      COMPLETE                              */
    /* ---------------------------------------------------------- */

    function testCompleteContract() public {
        contractInstance.activate();
        contractInstance.reportConsumption(100);
        contractInstance.complete();

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.COMPLETED)
        );

        assertEq(contractInstance.totalAmountCop(), 100 * pricePerKwh);
    }

    /* ---------------------------------------------------------- */
    /*                      TERMINATE                             */
    /* ---------------------------------------------------------- */

    function testTerminateActiveContract() public {
        contractInstance.activate();
        contractInstance.terminate();

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.TERMINATED)
        );
    }

    /* ---------------------------------------------------------- */
    /*                  REVERT CASES                              */
    /* ---------------------------------------------------------- */

    function testRevertTerminateBeforeActivation() public {
        vm.expectRevert();
        contractInstance.terminate();
    }

    function testRevertActivateTwice() public {
        contractInstance.activate();
        vm.expectRevert();
        contractInstance.activate();
    }

    function testRevertReportBeforeActivation() public {
        vm.expectRevert();
        contractInstance.reportConsumption(10);
    }

    function testRevertCompleteWithoutActivation() public {
        vm.expectRevert();
        contractInstance.complete();
    }
}