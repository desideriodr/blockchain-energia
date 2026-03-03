// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/EnergySupplyContract.sol";

contract EnergySupplyContractTest is Test {

    EnergySupplyContract contractInstance;

    address buyer = address(0x1);
    address seller = address(0x2);
    address oracle = address(this);

    uint256 pricePerKwh = 500;

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
            end,
            "SOLAR"
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

    function testSourceType() public view {
        assertEq(contractInstance.sourceType(), "SOLAR");
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
    /*                      SUSPEND / RESUME                      */
    /* ---------------------------------------------------------- */

    function testSuspendAndResume() public {
        contractInstance.activate();

        contractInstance.suspend("Fondos insuficientes");

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.SUSPENDED)
        );

        assertEq(
            contractInstance.suspensionReason(),
            "Fondos insuficientes"
        );

        contractInstance.resume();

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.ACTIVE)
        );
    }

    /* ---------------------------------------------------------- */
    /*                      CANCEL                                */
    /* ---------------------------------------------------------- */

    function testCancelActiveContract() public {
        contractInstance.activate();

        contractInstance.cancel("Cancelado por comprador");

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.CANCELED)
        );

        assertEq(
            contractInstance.terminationReason(),
            "Cancelado por comprador"
        );
    }

    /* ---------------------------------------------------------- */
    /*                  TERMINATE BY EXPIRATION                   */
    /* ---------------------------------------------------------- */

    function testTerminateByExpiration() public {
        contractInstance.activate();

        // Simular paso del tiempo
        vm.warp(end + 1);

        contractInstance.terminateByExpiration();

        assertEq(
            uint(contractInstance.state()),
            uint(EnergySupplyContract.ContractState.TERMINATED)
        );
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
    /*                  REVERT CASES                              */
    /* ---------------------------------------------------------- */

    function testRevertTerminateBeforeExpiration() public {
        contractInstance.activate();
        vm.expectRevert();
        contractInstance.terminateByExpiration();
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

    function testRevertCancelBeforeActivation() public {
        vm.expectRevert();
        contractInstance.cancel("motivo");
    }

    function testRevertSuspendBeforeActivation() public {
        vm.expectRevert();
        contractInstance.suspend("motivo");
    }
}