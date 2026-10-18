// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/phase2/CommunityFund.sol";
import "../../src/phase2/CommunityFundFactory.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6); // 1,000,000 USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CommunityFundTest is Test {
    MockUSDC public token;
    CommunityFund public fund;
    CommunityFundFactory public factory;

    address public manager = address(0xAA);
    address public member1 = address(0x11);
    address public member2 = address(0x22);
    address public member3 = address(0x33);
    address public externalDonor = address(0x44);
    address payable public vendor = payable(address(0x55));

    address[] public initialMembers;

    function setUp() public {
        vm.startPrank(manager);
        token = new MockUSDC();
        factory = new CommunityFundFactory();

        initialMembers = new address[](3);
        initialMembers[0] = member1;
        initialMembers[1] = member2;
        initialMembers[2] = member3;

        // Quỹ 3 thành viên, yêu cầu tối thiểu 2/3 người duyệt để xuất tiền
        fund = new CommunityFund(
            address(token),
            "Quy Team Dev UniHack 2026",
            "Quy chung de chi phi may chu, an uong va cong cu AI",
            initialMembers,
            2, // 2 trên 3 người duyệt
            manager
        );

        token.mint(member1, 10_000 * 1e6);
        token.mint(member2, 10_000 * 1e6);
        token.mint(member3, 10_000 * 1e6);
        token.mint(externalDonor, 10_000 * 1e6);

        vm.stopPrank();
    }

    // -------------------------------------------------------------
    // TEST 1: NẠP TIỀN VÀO KÉT SẮT & SỔ THU CHI MINH BẠCH
    // -------------------------------------------------------------
    function testDepositAndAuditLog() public {
        // Member 1 nạp 500 USDC
        vm.startPrank(member1);
        token.approve(address(fund), 500 * 1e6);
        fund.deposit(500 * 1e6, "Dong quy thang 10");
        vm.stopPrank();

        // Mạnh thường quân ngoài nạp 1000 USDC
        vm.startPrank(externalDonor);
        token.approve(address(fund), 1000 * 1e6);
        fund.deposit(1000 * 1e6, "Tai tro hackathon");
        vm.stopPrank();

        assertEq(fund.getVaultBalance(), 1500 * 1e6);
        assertEq(fund.totalDepositedBalance(), 1500 * 1e6);

        ICommunityFund.DepositRecord[] memory records = fund.getDepositRecords();
        assertEq(records.length, 2);
        assertEq(records[0].depositor, member1);
        assertEq(records[0].amount, 500 * 1e6);
        assertEq(records[0].note, "Dong quy thang 10");
        assertEq(records[1].depositor, externalDonor);
        assertEq(records[1].amount, 1000 * 1e6);
        assertEq(records[1].note, "Tai tro hackathon");
    }

    // -------------------------------------------------------------
    // TEST 2: TẠO LỆNH CHI & DUYỆT ĐỦ SỐ LƯỢNG THÌ TỰ ĐỘNG XUẤT TIỀN
    // -------------------------------------------------------------
    function testCreateSpendRequestAndAutoExecution() public {
        // Nạp tiền trước vào két
        vm.startPrank(member1);
        token.approve(address(fund), 1000 * 1e6);
        fund.deposit(1000 * 1e6, "Quy dau tu ban dau");

        // Member 1 tạo đề xuất chi 300 USDC trả tiền máy chủ Cloud
        uint256 reqId = fund.createSpendRequest(
            vendor,
            300 * 1e6,
            "Thue server GPU Cloud cho AI subagents",
            "ipfs://QmInvoiceCloudServerOct2026"
        );
        vm.stopPrank();

        assertEq(reqId, 0);
        ICommunityFund.SpendRequest memory req = fund.getSpendRequest(0);
        assertEq(req.amount, 300 * 1e6);
        assertEq(req.approvalCount, 0);
        assertEq(uint256(req.status), uint256(ICommunityFund.RequestStatus.Pending));

        // Member 1 bấm duyệt (1/2)
        vm.prank(member1);
        fund.approveSpendRequest(0);

        req = fund.getSpendRequest(0);
        assertEq(req.approvalCount, 1);
        assertEq(uint256(req.status), uint256(ICommunityFund.RequestStatus.Pending));
        assertEq(token.balanceOf(vendor), 0); // Chưa xuất tiền

        // Member 2 bấm duyệt (2/2) -> Đủ điều kiện, hợp đồng TỰ ĐỘNG chuyển tiền ngay cho vendor!
        vm.prank(member2);
        fund.approveSpendRequest(0);

        req = fund.getSpendRequest(0);
        assertEq(req.approvalCount, 2);
        assertEq(uint256(req.status), uint256(ICommunityFund.RequestStatus.Executed));
        assertEq(token.balanceOf(vendor), 300 * 1e6); // Vendor đã nhận đúng 300 USDC
        assertEq(fund.getVaultBalance(), 700 * 1e6);  // Quỹ còn 700 USDC
        assertEq(fund.totalSpentBalance(), 300 * 1e6);
    }

    // -------------------------------------------------------------
    // TEST 3: NGƯỜI NGOÀI KHÔNG THỂ TẠO LỆNH HOẶC DUYỆT CHI
    // -------------------------------------------------------------
    function testNonMemberCannotCreateOrApprove() public {
        vm.startPrank(member1);
        token.approve(address(fund), 500 * 1e6);
        fund.deposit(500 * 1e6, "Quy khoi tao");
        vm.stopPrank();

        // External donor không phải thành viên, cố tạo lệnh chi -> REVERT
        vm.startPrank(externalDonor);
        vm.expectRevert("Only fund members allowed");
        fund.createSpendRequest(vendor, 100 * 1e6, "Rut trom", "");
        vm.stopPrank();

        // Member 1 tạo lệnh hợp lệ
        vm.prank(member1);
        uint256 reqId = fund.createSpendRequest(vendor, 100 * 1e6, "Mua cafe team", "");

        // External donor cố bấm duyệt -> REVERT
        vm.startPrank(externalDonor);
        vm.expectRevert("Only fund members allowed");
        fund.approveSpendRequest(reqId);
        vm.stopPrank();
    }

    // -------------------------------------------------------------
    // TEST 4: KHÔNG THỂ DUYỆT 2 LẦN BỞI CÙNG 1 NGƯỜI
    // -------------------------------------------------------------
    function testCannotApproveTwice() public {
        vm.startPrank(member1);
        token.approve(address(fund), 500 * 1e6);
        fund.deposit(500 * 1e6, "Quy khoi tao");
        uint256 reqId = fund.createSpendRequest(vendor, 100 * 1e6, "Mua dung cu", "");
        fund.approveSpendRequest(reqId);

        // Member 1 cố bấm duyệt lần 2 -> REVERT
        vm.expectRevert("Already approved by this member");
        fund.approveSpendRequest(reqId);
        vm.stopPrank();
    }

    // -------------------------------------------------------------
    // TEST 5: HỦY LỆNH CHI BỞI NGƯỜI TẠO HOẶC QUẢN LÝ
    // -------------------------------------------------------------
    function testCancelSpendRequest() public {
        vm.startPrank(member1);
        token.approve(address(fund), 500 * 1e6);
        fund.deposit(500 * 1e6, "Quy khoi tao");
        uint256 reqId = fund.createSpendRequest(vendor, 100 * 1e6, "Ke hoach can huy", "");

        fund.cancelSpendRequest(reqId);
        ICommunityFund.SpendRequest memory req = fund.getSpendRequest(reqId);
        assertEq(uint256(req.status), uint256(ICommunityFund.RequestStatus.Cancelled));

        // Sau khi hủy thì không ai duyệt được nữa
        vm.expectRevert("Request not pending");
        fund.approveSpendRequest(reqId);
        vm.stopPrank();
    }

    // -------------------------------------------------------------
    // TEST 6: FACTORY TẠO QUỸ THÀNH CÔNG
    // -------------------------------------------------------------
    function testFactoryCreateFund() public {
        address[] memory members = new address[](2);
        members[0] = member1;
        members[1] = member2;

        address createdFundAddr = factory.createFund(
            address(token),
            "Quy Hoi Ban Than",
            "Du lich he 2026",
            members,
            2
        );

        assertTrue(createdFundAddr != address(0));
        assertTrue(factory.isFundFromFactory(createdFundAddr));
        assertEq(factory.totalFundsCount(), 1);

        CommunityFund newFund = CommunityFund(createdFundAddr);
        assertEq(newFund.fundName(), "Quy Hoi Ban Than");
        assertEq(newFund.requiredApprovals(), 2);
        assertTrue(newFund.isMember(member1));
        assertTrue(newFund.isMember(member2));
        assertFalse(newFund.isMember(member3));
    }
}
