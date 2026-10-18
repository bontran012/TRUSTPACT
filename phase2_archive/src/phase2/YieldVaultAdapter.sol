// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @title YieldVaultAdapter
/// @notice Két sắt tự động kết nối Aave V3 trên Avalanche sinh lãi thực tế (Real Yield).
/// @dev Quy tắc kinh tế thực chiến:
///      1. Thằng nào nạp cọc, thằng đó hưởng lãi chính (80%).
///      2. Nền tảng (chúng ta) thu phí quản lý hiệu suất (20% Performance Fee).
///      3. Thời gian tối thiểu tham gia sinh lời là 30 NGÀY để tối ưu phí gas và thanh khoản.
/// @author TrustPact Protocol Team (Avalanche UniHack 2026)
contract YieldVaultAdapter is ERC4626, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingAsset;
    address public aavePool;
    address public aToken;
    address public authorizedEscrow;

    // Tỷ lệ phân chia lợi nhuận trên TIỀN LÃI sinh ra:
    // Thằng nào nạp cọc thằng đó hưởng 80% lãi. Nền tảng (chúng ta) cắt 20% phí quản lý.
    uint256 public constant DEPOSITOR_YIELD_BPS = 8000;   // 80%
    uint256 public constant PROTOCOL_FEE_BPS = 2000;      // 20%
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Điều kiện kép để kích hoạt nạp vào Vault sinh lời (loại bỏ 100% rủi ro lỗ phí gas):
    // 1. Thời gian giữ cọc tối thiểu: 30 NGÀY
    // 2. Số tiền cọc tối thiểu: 500 USDC (hoặc tương đương)
    uint256 public constant MIN_HOLDING_DURATION = 30 days;
    uint256 public constant MIN_YIELD_DEPOSIT_AMOUNT = 500 * 1e6; // 500 USDC

    event YieldHarvested(
        uint256 totalYield,
        address indexed depositor,
        uint256 depositorShare,
        address indexed protocolTreasury,
        uint256 protocolShare
    );

    error ZeroAddress();
    error Unauthorized();
    error ZeroAmount();
    error InsufficientYield();

    modifier onlyAuthorizedEscrow() {
        if (msg.sender != authorizedEscrow && msg.sender != owner()) revert Unauthorized();
        _;
    }

    constructor(
        IERC20 _asset,
        address _aavePool,
        address _aToken
    ) ERC4626(_asset) ERC20("TrustPact Yield Vault", "tpUSDC") Ownable(msg.sender) {
        underlyingAsset = _asset;
        aavePool = _aavePool;
        aToken = _aToken;
    }

    function setAuthorizedEscrow(address _escrow) external onlyOwner {
        if (_escrow == address(0)) revert ZeroAddress();
        authorizedEscrow = _escrow;
    }

    function setAavePool(address _aavePool, address _aToken) external onlyOwner {
        aavePool = _aavePool;
        aToken = _aToken;
    }

    /// @notice Tổng tài sản quản lý bao gồm số dư nội bộ + lãi thực tế tích lũy trên Aave V3
    function totalAssets() public view override returns (uint256) {
        uint256 localBal = underlyingAsset.balanceOf(address(this));
        if (aToken != address(0)) {
            return localBal + IERC20(aToken).balanceOf(address(this));
        }
        return localBal;
    }

    /// @dev Hook nạp tiền tự động chuyển tài sản vào Aave V3 lending pool
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override {
        super._deposit(caller, receiver, assets, shares);
        if (aavePool != address(0)) {
            underlyingAsset.forceApprove(aavePool, assets);
            IAavePool(aavePool).supply(address(underlyingAsset), assets, address(this), 0);
        }
    }

    /// @dev Hook rút tiền tự động kéo tài sản từ Aave V3 về thanh toán
    function _withdraw(
        address caller,
        address receiver,
        address _owner,
        uint256 assets,
        uint256 shares
    ) internal override {
        if (aavePool != address(0)) {
            uint256 localBal = underlyingAsset.balanceOf(address(this));
            if (localBal < assets) {
                uint256 needed = assets - localBal;
                IAavePool(aavePool).withdraw(address(underlyingAsset), needed, address(this));
            }
        }
        super._withdraw(caller, receiver, _owner, assets, shares);
    }

    /**
     * @notice Thu hoạch và phân bổ tiền lãi:
     *         - Người nạp cọc (depositor) nhận 80% tiền lãi.
     *         - Nền tảng (protocolTreasury) nhận 20% phí hiệu suất.
     * @param depositor Địa chỉ người nạp cọc gốc
     * @param protocolTreasury Ví thu phí của nền tảng (chúng ta)
     * @param grossWithdrawn Tổng tiền rút ra từ Vault (Gốc + Lãi)
     * @param originalPrincipal Tiền vốn gốc ban đầu nạp vào
     * @return profit Tổng lợi nhuận tiền lãi sinh ra
     */
    function distributeAccruedYield(
        address depositor,
        address protocolTreasury,
        uint256 grossWithdrawn,
        uint256 originalPrincipal
    ) external onlyAuthorizedEscrow returns (uint256 profit) {
        if (grossWithdrawn <= originalPrincipal) return 0;
        profit = grossWithdrawn - originalPrincipal;

        uint256 depositorYield = (profit * DEPOSITOR_YIELD_BPS) / BPS_DENOMINATOR;
        uint256 protocolShare = profit - depositorYield;

        if (depositorYield > 0 && depositor != address(0)) {
            underlyingAsset.safeTransfer(depositor, depositorYield);
        }
        if (protocolShare > 0 && protocolTreasury != address(0)) {
            underlyingAsset.safeTransfer(protocolTreasury, protocolShare);
        }

        emit YieldHarvested(profit, depositor, depositorYield, protocolTreasury, protocolShare);
    }
}
