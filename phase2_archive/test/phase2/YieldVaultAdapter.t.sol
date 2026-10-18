// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/phase2/YieldVaultAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract YieldVaultAdapterTest is Test {
    MockUSDC public token;
    YieldVaultAdapter public vault;

    address public owner = address(0xAA);
    address public protocolTreasury = address(0xBB); // Ví thu phí của chúng ta
    address public depositor = address(0x11);        // Thằng nạp cọc
    address public mockEscrow = address(0x22);

    function setUp() public {
        vm.startPrank(owner);
        token = new MockUSDC();
        // Triển khai Vault (standalone mock pool)
        vault = new YieldVaultAdapter(token, address(0), address(0));
        vault.setAuthorizedEscrow(mockEscrow);
        vm.stopPrank();

        token.mint(depositor, 50_000 * 1e6);
        token.mint(address(vault), 10_000 * 1e6); // Tiền lãi tích lũy sẵn trong vault
    }

    function testConstantsAndThresholds() public view {
        assertEq(vault.DEPOSITOR_YIELD_BPS(), 8000); // Thằng nạp cọc ăn 80%
        assertEq(vault.PROTOCOL_FEE_BPS(), 2000);   // Nền tảng (chúng ta) ăn 20%
        assertEq(vault.MIN_HOLDING_DURATION(), 30 days); // Tối thiểu 30 ngày
        assertEq(vault.MIN_YIELD_DEPOSIT_AMOUNT(), 500 * 1e6); // Tối thiểu 500 USDC
    }

    function testDistributeYieldCorrectSplit() public {
        // Giả lập nạp 10,000 USDC vốn gốc
        uint256 principal = 10_000 * 1e6;
        // Sau 30 ngày, rút ra được 10,100 USDC (Lãi 100 USDC)
        uint256 grossWithdrawn = 10_100 * 1e6;

        vm.prank(mockEscrow);
        uint256 profit = vault.distributeAccruedYield(
            depositor,
            protocolTreasury,
            grossWithdrawn,
            principal
        );

        assertEq(profit, 100 * 1e6); // Lãi 100 USDC

        // Người nạp cọc nhận đúng 80% lãi = 80 USDC
        assertEq(token.balanceOf(depositor), 50_000 * 1e6 + 80 * 1e6);

        // Nền tảng (chúng ta) đút túi đúng 20% lãi = 20 USDC
        assertEq(token.balanceOf(protocolTreasury), 20 * 1e6);
    }
}
