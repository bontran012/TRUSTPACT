// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MockAToken.sol";
import "./MockERC20.sol";

/// @title MockAavePool — Simulates Aave V3 Pool supply, withdraw, and yield accrual
contract MockAavePool {
    using SafeERC20 for IERC20;

    MockAToken public immutable aToken;
    MockERC20 public immutable underlying;

    constructor(address _underlying, address _aToken) {
        underlying = MockERC20(_underlying);
        aToken = MockAToken(_aToken);
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /*referralCode*/
    ) external {
        require(asset == address(underlying), "Invalid asset");
        require(amount > 0, "Amount must be > 0");

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        require(asset == address(underlying), "Invalid asset");
        require(amount > 0, "Amount must be > 0");

        // Burn aToken from caller
        aToken.burn(msg.sender, amount);

        // Ensure pool has sufficient underlying to cover principal + yield
        uint256 poolBal = underlying.balanceOf(address(this));
        if (poolBal < amount) {
            underlying.mint(address(this), amount - poolBal);
        }

        IERC20(address(underlying)).safeTransfer(to, amount);
        return amount;
    }

    /// @notice Simulates interest accrual on aToken holder balance
    function simulateYield(address holder, uint256 yieldAmount) external {
        aToken.mint(holder, yieldAmount);
        underlying.mint(address(this), yieldAmount);
    }
}
