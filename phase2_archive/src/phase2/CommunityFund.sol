// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/ICommunityFund.sol";

/// @title CommunityFund — Két Sắt & Sổ Thu Chi Nhóm Minh Bạch (Transparent Group Vault)
/// @notice Giải pháp quản lý thu/chi thực tế cho các nhóm bạn, team MMO, lớp học, CLB, gia đình:
///         - Tiền nằm trong két sắt Smart Contract, không cá nhân nào ôm chạy được.
///         - Sổ thu chi công khai từng xu trên chuỗi (Real-time Audit Log).
///         - Chi tiêu chỉ xuất tiền khi đủ số lượng thành viên trong nhóm bấm Duyệt.
///         - Nhóm dùng vào việc gì, quy tắc ra sao hoàn toàn tùy thuộc vào người dùng.
contract CommunityFund is ICommunityFund, ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    string public fundName;
    string public fundDescription;
    uint256 public requiredApprovals; // Số lượng thành viên cần bấm Duyệt để xuất tiền

    uint256 public totalDepositedBalance;
    uint256 public totalSpentBalance;

    DepositRecord[] internal _depositRecords;
    SpendRequest[] internal _spendRequests;

    mapping(address => bool) public isMember;
    address[] public memberList;

    // requestId => approver => hasApproved
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    modifier onlyMember() {
        require(isMember[msg.sender], "Only fund members allowed");
        _;
    }

    constructor(
        address _token,
        string memory _name,
        string memory _description,
        address[] memory _initialMembers,
        uint256 _requiredApprovals,
        address _manager
    ) Ownable(_manager) {
        require(_token != address(0), "Invalid token address");
        require(_initialMembers.length > 0, "Must have initial members");
        require(_requiredApprovals > 0 && _requiredApprovals <= _initialMembers.length, "Invalid required approvals");

        token = IERC20(_token);
        fundName = _name;
        fundDescription = _description;
        requiredApprovals = _requiredApprovals;

        for (uint256 i = 0; i < _initialMembers.length; i++) {
            address m = _initialMembers[i];
            require(m != address(0), "Zero member address");
            if (!isMember[m]) {
                isMember[m] = true;
                memberList.push(m);
                emit MemberAdded(m);
            }
        }
    }

    /// @notice Nộp tiền vào quỹ: Bất kỳ ai cũng có thể đóng góp, ghi nhận rõ vào sổ cái
    function deposit(uint256 amount, string calldata note) external override nonReentrant {
        require(amount > 0, "Amount must be > 0");
        token.safeTransferFrom(msg.sender, address(this), amount);

        totalDepositedBalance += amount;
        _depositRecords.push(DepositRecord({
            depositor: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            note: note
        }));

        emit MoneyDeposited(msg.sender, amount, note, block.timestamp);
    }

    /// @notice Tạo lệnh chi tiêu: Thành viên nhóm tạo đề xuất rút tiền kèm lý do và chứng từ
    function createSpendRequest(
        address payable recipient,
        uint256 amount,
        string calldata reason,
        string calldata proofUri
    ) external override onlyMember returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(token.balanceOf(address(this)) >= amount, "Insufficient fund balance");

        uint256 reqId = _spendRequests.length;
        _spendRequests.push(SpendRequest({
            id: reqId,
            proposer: msg.sender,
            recipient: recipient,
            amount: amount,
            reason: reason,
            proofUri: proofUri,
            approvalCount: 0,
            status: RequestStatus.Pending,
            createdAt: block.timestamp,
            executedAt: 0
        }));

        emit SpendRequestCreated(reqId, msg.sender, recipient, amount, reason);
        return reqId;
    }

    /// @notice Duyệt lệnh chi: Thành viên kiểm tra lý do/hóa đơn, bấm Duyệt. Đủ duyệt là tiền tự xuất!
    function approveSpendRequest(uint256 requestId) external override onlyMember nonReentrant {
        require(requestId < _spendRequests.length, "Request does not exist");
        SpendRequest storage req = _spendRequests[requestId];
        require(req.status == RequestStatus.Pending, "Request not pending");
        require(!hasApproved[requestId][msg.sender], "Already approved by this member");

        hasApproved[requestId][msg.sender] = true;
        req.approvalCount++;

        emit SpendRequestApproved(requestId, msg.sender, req.approvalCount);

        // Khi đã đủ số lượng người duyệt quy định -> Tự động giải ngân thẳng về ví người nhận
        if (req.approvalCount >= requiredApprovals) {
            req.status = RequestStatus.Executed;
            req.executedAt = block.timestamp;
            totalSpentBalance += req.amount;

            token.safeTransfer(req.recipient, req.amount);
            emit SpendRequestExecuted(requestId, req.recipient, req.amount);
        }
    }

    /// @notice Hủy lệnh chi: Người tạo đề xuất hoặc quản lý có thể hủy nếu không chi nữa
    function cancelSpendRequest(uint256 requestId) external override nonReentrant {
        require(requestId < _spendRequests.length, "Request does not exist");
        SpendRequest storage req = _spendRequests[requestId];
        require(req.status == RequestStatus.Pending, "Request not pending");
        require(msg.sender == req.proposer || msg.sender == owner(), "Only proposer or owner can cancel");

        req.status = RequestStatus.Cancelled;
        emit SpendRequestCancelled(requestId);
    }

    /// @notice Quản lý quỹ: Thay đổi số lượng người duyệt cần thiết
    function setRequiredApprovals(uint256 newRequired) external onlyOwner {
        require(newRequired > 0 && newRequired <= memberList.length, "Invalid approval count");
        requiredApprovals = newRequired;
    }

    /// @notice Thêm thành viên mới vào nhóm
    function addMember(address newMember) external onlyOwner {
        require(newMember != address(0) && !isMember[newMember], "Invalid member");
        isMember[newMember] = true;
        memberList.push(newMember);
        emit MemberAdded(newMember);
    }

    /// @notice Lấy thông tin 1 lệnh chi
    function getSpendRequest(uint256 requestId) external view override returns (SpendRequest memory) {
        require(requestId < _spendRequests.length, "Request does not exist");
        return _spendRequests[requestId];
    }

    /// @notice Lấy toàn bộ danh sách lệnh chi (Sổ chi tiêu công khai)
    function getAllSpendRequests() external view returns (SpendRequest[] memory) {
        return _spendRequests;
    }

    /// @notice Lấy toàn bộ lịch sử nộp tiền (Sổ thu tiền công khai)
    function getDepositRecords() external view override returns (DepositRecord[] memory) {
        return _depositRecords;
    }

    /// @notice Lấy danh sách thành viên nhóm
    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    /// @notice Xem số dư thực tế hiện tại của két sắt
    function getVaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
