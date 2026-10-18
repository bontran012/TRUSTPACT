// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CommunityFund.sol";

/**
 * @title CommunityFundFactory
 * @notice Nhà máy tạo Két Sắt & Sổ Thu Chi Nhóm Minh Bạch TrustPact (Phân hệ 4)
 * @dev Cho phép bất kỳ hội nhóm, team dự án, phòng trọ, lớp học, CLB hay gia đình
 *      khởi tạo một quỹ nhóm minh bạch trên Avalanche chỉ với 1 giao dịch.
 */
contract CommunityFundFactory {

    struct FundRecord {
        address fundAddress;
        address creator;
        string name;
        address token;
        uint256 requiredApprovals;
        uint256 memberCount;
        uint256 createdAt;
    }

    FundRecord[] public allFunds;
    mapping(address => address[]) public fundsByCreator;
    mapping(address => bool) public isFundFromFactory;

    event FundCreated(
        address indexed fundAddress,
        address indexed creator,
        string name,
        address token,
        uint256 requiredApprovals,
        uint256 memberCount,
        uint256 timestamp
    );

    /**
     * @notice Khởi tạo một quỹ nhóm minh bạch mới
     * @param _token Token nộp quỹ (thường là USDC hoặc AVAX wrapped)
     * @param _name Tên quỹ (Ví dụ: "Quỹ Team Dev UniHack", "Quỹ Lớp K18", "Quỹ Thuê Nhà Tầng 3")
     * @param _description Mục đích và quy định sử dụng quỹ
     * @param _initialMembers Danh sách các thành viên ban đầu có quyền duyệt chi
     * @param _requiredApprovals Số lượt phê duyệt tối thiểu của thành viên để xuất tiền
     * @return fundAddress Địa chỉ két sắt vừa được khởi tạo
     */
    function createFund(
        address _token,
        string calldata _name,
        string calldata _description,
        address[] calldata _initialMembers,
        uint256 _requiredApprovals
    ) external returns (address fundAddress) {
        CommunityFund fund = new CommunityFund(
            _token,
            _name,
            _description,
            _initialMembers,
            _requiredApprovals,
            msg.sender
        );

        fundAddress = address(fund);

        allFunds.push(FundRecord({
            fundAddress: fundAddress,
            creator: msg.sender,
            name: _name,
            token: _token,
            requiredApprovals: _requiredApprovals,
            memberCount: _initialMembers.length,
            createdAt: block.timestamp
        }));

        fundsByCreator[msg.sender].push(fundAddress);
        isFundFromFactory[fundAddress] = true;

        emit FundCreated(
            fundAddress,
            msg.sender,
            _name,
            _token,
            _requiredApprovals,
            _initialMembers.length,
            block.timestamp
        );

        return fundAddress;
    }

    /**
     * @notice Lấy tổng số lượng quỹ đã tạo trên giao thức
     */
    function totalFundsCount() external view returns (uint256) {
        return allFunds.length;
    }

    /**
     * @notice Lấy danh sách quỹ do một địa chỉ khởi tạo
     */
    function getFundsByCreator(address creator) external view returns (address[] memory) {
        return fundsByCreator[creator];
    }

    /**
     * @notice Lấy danh sách thông tin tóm tắt tất cả các quỹ
     */
    function getAllFunds() external view returns (FundRecord[] memory) {
        return allFunds;
    }
}
