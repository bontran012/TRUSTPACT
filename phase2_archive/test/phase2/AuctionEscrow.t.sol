// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/phase2/AuctionEscrow.sol";
import "../../src/interfaces/IAuctionEscrow.sol";
import "../mocks/MockUSDC.sol";
import "../mocks/MockUniversalEscrow.sol";

contract AuctionEscrowTest is Test {
    AuctionEscrow public auctionEscrow;
    MockUSDC public usdc;
    MockUniversalEscrow public universalEscrow;

    address public owner = address(0x1);
    address public treasury = address(0x2);
    address public seller = address(0x3);
    address public broker = address(0x4);
    address public alice = address(0x10);
    address public bob = address(0x20);
    address public charlie = address(0x30);

    uint256 public constant FLOOR_PRICE = 1_000 * 1e6;     // 1,000 USDC
    uint256 public constant MIN_INCREMENT = 50 * 1e6;      // Bước giá tối thiểu: 50 USDC
    uint256 public constant BID_BOND = 100 * 1e6;          // Cọc bảo chứng: 100 USDC
    uint256 public constant AUCTION_DURATION = 1 days;

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        universalEscrow = new MockUniversalEscrow(address(usdc));
        auctionEscrow = new AuctionEscrow(
            address(usdc),
            treasury,
            address(universalEscrow),
            owner
        );
        vm.stopPrank();

        // Mint USDC cho các bên
        usdc.mint(alice, 10_000 * 1e6);
        usdc.mint(bob, 10_000 * 1e6);
        usdc.mint(charlie, 10_000 * 1e6);

        // Approve
        vm.prank(alice);
        usdc.approve(address(auctionEscrow), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(auctionEscrow), type(uint256).max);
        vm.prank(charlie);
        usdc.approve(address(auctionEscrow), type(uint256).max);
    }

    function _createDefaultAuction() internal returns (uint256) {
        vm.prank(seller);
        bytes32 itemHash = keccak256("unique-digital-asset-001");
        return auctionEscrow.createAuction(
            IAuctionEscrow.AuctionType.ForwardAuction,
            itemHash,
            broker,
            FLOOR_PRICE,
            MIN_INCREMENT,
            BID_BOND,
            AUCTION_DURATION
        );
    }

    // =========================================================================
    // TEST 1: BƯỚC GIÁ TỐI THIỂU (MIN BID INCREMENT) BẮT BUỘC
    // =========================================================================
    function test_MinBidIncrementEnforced() public {
        uint256 auctionId = _createDefaultAuction();

        // Alice bid giá sàn 1,000 USDC hợp lệ
        vm.prank(alice);
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE, "Alice bid");

        // Bob cố gắng bid cao hơn chỉ 1 USDC (1,001 USDC < 1,000 + 50) -> Phải REVERT!
        vm.prank(bob);
        vm.expectRevert("Offer must exceed current high by minBidIncrement");
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE + 1 * 1e6, "Bob invalid bid");

        // Bob bid hợp lệ: 1,050 USDC (đúng bằng winningPrice + MIN_INCREMENT)
        vm.prank(bob);
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE + MIN_INCREMENT, "Bob valid bid");

        IAuctionEscrow.AuctionSession memory session = auctionEscrow.getAuction(auctionId);
        assertEq(session.winningBidder, bob);
        assertEq(session.winningPrice, FLOOR_PRICE + MIN_INCREMENT);
    }

    // =========================================================================
    // TEST 2: THỜI GIAN CỐ ĐỊNH — HẾT GIỜ LÀ CHỐT, KHÔNG KÉO DÀI
    // =========================================================================
    function test_FixedDeadlineNoEndlessExtension() public {
        uint256 auctionId = _createDefaultAuction();
        IAuctionEscrow.AuctionSession memory session = auctionEscrow.getAuction(auctionId);
        uint256 deadline = session.endTime;

        // Alice bid trước khi hết giờ 5 phút
        vm.warp(deadline - 5 minutes);
        vm.prank(alice);
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE, "Alice bid near end");

        // Hạn chót VẪN GIỮ NGUYÊN là deadline ban đầu, KHÔNG BỊ KÉO DÀI THÊM!
        session = auctionEscrow.getAuction(auctionId);
        assertEq(session.endTime, deadline, "Deadline must remain fixed without extension");

        // Nhảy qua hạn chót 1 giây -> Hết giờ!
        vm.warp(deadline + 1);

        // Bob cố bid sau khi hết giờ -> Phải REVERT!
        vm.prank(bob);
        vm.expectRevert("Auction ended - time is up!");
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE + MIN_INCREMENT, "Bob late bid");
    }

    // =========================================================================
    // TEST 3: NGƯỜI CAO NHẤT THẮNG LUÔN, CỌC CHUYỂN THẲNG SANG ESCROW 3 BÊN
    // =========================================================================
    function test_WinnerSettledAndBondBridgedDirectly() public {
        uint256 auctionId = _createDefaultAuction();

        vm.prank(alice);
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE, "Alice");

        vm.prank(bob);
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE + MIN_INCREMENT, "Bob");

        // Hết giờ
        vm.warp(block.timestamp + AUCTION_DURATION + 1);

        // Chốt phiên đấu giá
        auctionEscrow.settleAuction(auctionId);

        IAuctionEscrow.AuctionSession memory session = auctionEscrow.getAuction(auctionId);
        assertEq(session.winningBidder, bob, "Highest bidder must win");
        assertEq(uint8(session.status), uint8(IAuctionEscrow.AuctionStatus.Settled));

        // Người thua (Alice) rút lại 100% cọc 100 USDC ngay lập tức!
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        auctionEscrow.claimRefund(auctionId);
        assertEq(usdc.balanceOf(alice) - aliceBefore, BID_BOND, "Loser must get full 100% refund");

        // Người thắng (Bob) không thể claim refund vì cọc đã chuyển sang Escrow 3 bên
        vm.prank(bob);
        vm.expectRevert("Winner bond was bridged to escrow");
        auctionEscrow.claimRefund(auctionId);
    }

    // =========================================================================
    // TEST 4: SAFETY HATCH THOÁT HIỂM SAU 7 NGÀY
    // =========================================================================
    function test_SafetyHatchAfter7Days() public {
        uint256 auctionId = _createDefaultAuction();

        vm.prank(alice);
        auctionEscrow.submitBid(auctionId, FLOOR_PRICE, "Alice");

        // Quá hạn 7 ngày sau khi kết thúc mà không ai settle
        vm.warp(block.timestamp + AUCTION_DURATION + 7 days + 1 hours);

        auctionEscrow.cancelExpiredUnsettledAuction(auctionId);

        IAuctionEscrow.AuctionSession memory session = auctionEscrow.getAuction(auctionId);
        assertEq(uint8(session.status), uint8(IAuctionEscrow.AuctionStatus.Cancelled));

        // Alice rút lại cọc an toàn
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        auctionEscrow.claimRefund(auctionId);
        assertEq(usdc.balanceOf(alice) - aliceBefore, BID_BOND);
    }
}
