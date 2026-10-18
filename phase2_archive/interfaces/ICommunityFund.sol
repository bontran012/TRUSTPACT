// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICommunityFund — Két Sắt & Sổ Thu Chi Minh Bạch Nhóm (Transparent Group Vault)
interface ICommunityFund {
    enum RequestStatus {
        Pending,   // Chờ duyệt
        Executed,  // Đã xuất tiền
        Cancelled  // Đã hủy
    }

    struct DepositRecord {
        address depositor;
        uint256 amount;
        uint256 timestamp;
        string note;
    }

    struct SpendRequest {
        uint256 id;
        address proposer;          // Người tạo lệnh chi
        address payable recipient; // Người nhận tiền (bên bán / người làm)
        uint256 amount;            // Số tiền cần chi
        string reason;             // Lý do chi tiêu
        string proofUri;           // Link ảnh hóa đơn / chứng từ
        uint256 approvalCount;     // Số người đã bấm duyệt
        RequestStatus status;
        uint256 createdAt;
        uint256 executedAt;
    }

    event MoneyDeposited(address indexed depositor, uint256 amount, string note, uint256 timestamp);
    event SpendRequestCreated(uint256 indexed id, address indexed proposer, address indexed recipient, uint256 amount, string reason);
    event SpendRequestApproved(uint256 indexed id, address indexed approver, uint256 currentApprovals);
    event SpendRequestExecuted(uint256 indexed id, address indexed recipient, uint256 amount);
    event SpendRequestCancelled(uint256 indexed id);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    function deposit(uint256 amount, string calldata note) external;
    function createSpendRequest(address payable recipient, uint256 amount, string calldata reason, string calldata proofUri) external returns (uint256);
    function approveSpendRequest(uint256 requestId) external;
    function cancelSpendRequest(uint256 requestId) external;
    function getSpendRequest(uint256 requestId) external view returns (SpendRequest memory);
    function getDepositRecords() external view returns (DepositRecord[] memory);
}
