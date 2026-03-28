// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/EnergyREC.sol";

contract EnergyRECTest is Test {

    EnergyREC rec;

    address owner  = address(this);
    address oracle = address(0x1);
    address producer = address(0x2);
    address consumer = address(0x3);
    address other    = address(0x4);

    uint256 ONE_KWH  = 10_000; // 1 kWh con 4 decimales
    uint256 HALF_KWH = 5_000;  // 0.5 kWh con 4 decimales

    function setUp() public {
        rec = new EnergyREC(oracle);
    }

    /* ---------------------------------------------------------- */
    /*                      DEPLOYMENT                            */
    /* ---------------------------------------------------------- */

    function testNombreYSimbolo() public view {
        assertEq(rec.name(), "Energy REC");
        assertEq(rec.symbol(), "REC");
    }

    function testDecimales() public view {
        assertEq(rec.decimals(), 4);
    }

    function testOracleInicializado() public view {
        assertEq(rec.oracle(), oracle);
    }

    function testSupplyInicialCero() public view {
        assertEq(rec.totalSupply(), 0);
    }

    /* ---------------------------------------------------------- */
    /*                         MINT                               */
    /* ---------------------------------------------------------- */

    function testMintPorOracle() public {
        vm.prank(oracle);
        rec.mint(producer, "SOLAR", ONE_KWH);
        assertEq(rec.balanceOf(producer), ONE_KWH);
    }

    function testMintAumentaTotalSupply() public {
        vm.prank(oracle);
        rec.mint(producer, "SOLAR", ONE_KWH);
        vm.prank(oracle);
        rec.mint(producer, "EOLICA", HALF_KWH);
        assertEq(rec.totalSupply(), ONE_KWH + HALF_KWH);
    }

    function testMintEmiteEventoRECMinted() public {
        vm.prank(oracle);
        vm.expectEmit(true, false, false, true);
        emit EnergyREC.RECMinted(producer, "SOLAR", ONE_KWH, block.timestamp);
        rec.mint(producer, "SOLAR", ONE_KWH);
    }

    function testRevertMintSiNoEsOracle() public {
        vm.prank(other);
        vm.expectRevert("EnergyREC: only oracle");
        rec.mint(producer, "SOLAR", ONE_KWH);
    }

    function testRevertMintSiAmountCero() public {
        vm.prank(oracle);
        vm.expectRevert("EnergyREC: amount must be greater than 0");
        rec.mint(producer, "SOLAR", 0);
    }

    /* ---------------------------------------------------------- */
    /*                         BURN                               */
    /* ---------------------------------------------------------- */

    function testBurnPorOracle() public {
        vm.prank(oracle);
        rec.mint(consumer, "SOLAR", ONE_KWH);

        vm.prank(oracle);
        rec.burn(consumer, producer, HALF_KWH);

        assertEq(rec.balanceOf(consumer), ONE_KWH - HALF_KWH);
    }

    function testBurnReduceTotalSupply() public {
        vm.prank(oracle);
        rec.mint(consumer, "SOLAR", ONE_KWH);

        vm.prank(oracle);
        rec.burn(consumer, producer, ONE_KWH);

        assertEq(rec.totalSupply(), 0);
    }

    function testBurnEmiteEventoRECBurned() public {
        vm.prank(oracle);
        rec.mint(consumer, "SOLAR", ONE_KWH);

        vm.prank(oracle);
        vm.expectEmit(true, true, false, true);
        emit EnergyREC.RECBurned(consumer, producer, HALF_KWH, block.timestamp);
        rec.burn(consumer, producer, HALF_KWH);
    }

    function testRevertBurnSiNoEsOracle() public {
        vm.prank(oracle);
        rec.mint(consumer, "SOLAR", ONE_KWH);

        vm.prank(other);
        vm.expectRevert("EnergyREC: only oracle");
        rec.burn(consumer, producer, HALF_KWH);
    }

    function testRevertBurnSiBalanceInsuficiente() public {
        vm.prank(oracle);
        rec.mint(consumer, "SOLAR", ONE_KWH);

        vm.prank(oracle);
        vm.expectRevert("EnergyREC: insufficient REC balance");
        rec.burn(consumer, producer, ONE_KWH * 2);
    }

    /* ---------------------------------------------------------- */
    /*                     UPDATE ORACLE                          */
    /* ---------------------------------------------------------- */

    function testOwnerPuedeActualizarOracle() public {
        rec.updateOracle(other);
        assertEq(rec.oracle(), other);
    }

    function testRevertUpdateOracleSiNoEsOwner() public {
        vm.prank(other);
        vm.expectRevert();
        rec.updateOracle(other);
    }

    function testRevertUpdateOracleSiAddressCero() public {
        vm.expectRevert("EnergyREC: new oracle is zero address");
        rec.updateOracle(address(0));
    }
}
