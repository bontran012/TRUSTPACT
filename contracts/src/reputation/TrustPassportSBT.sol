// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title TrustPassportSBT — Non-Transferable Soulbound Token (SBT) Reputation Passport
/// @notice Records verified deal count, success rate, USDC transaction volume, staked collateral, and slashing history
contract TrustPassportSBT is ERC721 {

    struct TrustProfile {
        uint256 successfulDeals;
        uint256 totalDeals;
        uint256 totalVolumeUSDC;
        uint256 stakedAmount;
        uint256 slashedCount;
        uint256 lastUpdated;
        uint256 totalRatingStars;
        uint256 ratingCount;
        uint256 totalTipsReceived;
    }

    mapping(address => TrustProfile) public profiles;
    mapping(address => bool) public authorizedUpdaters;
    address public admin;
    uint256 private _tokenIdCounter;

    event ProfileUpdated(address indexed user, uint256 successfulDeals, uint256 totalDeals);
    event PassportMinted(address indexed user, uint256 tokenId);
    event AuthorizedUpdaterSet(address indexed updater, bool authorized);
    event RatingRecorded(address indexed broker, uint8 stars, uint256 tipAmount, uint256 newTotalStars, uint256 newRatingCount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == admin, "Unauthorized");
        _;
    }

    constructor() ERC721("TrustPact Passport", "TPPASS") {
        admin = msg.sender;
    }

    /// @notice Soulbound mechanism: strictly reverts on any transfer between accounts
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    function setAuthorizedUpdater(address _updater, bool _auth) external onlyAdmin {
        require(_updater != address(0), "Zero address");
        authorizedUpdaters[_updater] = _auth;
        emit AuthorizedUpdaterSet(_updater, _auth);
    }

    function mintPassport(address _user) external onlyAuthorized {
        require(_user != address(0), "Zero address");
        require(balanceOf(_user) == 0, "Already has passport");
        _tokenIdCounter++;
        emit PassportMinted(_user, _tokenIdCounter);
        _safeMint(_user, _tokenIdCounter);
    }

    function updateProfile(address _user, bool _isSuccess, uint256 _dealVolume) external onlyAuthorized {
        TrustProfile storage p = profiles[_user];
        p.totalDeals++;
        if (_isSuccess) {
            p.successfulDeals++;
        }
        p.totalVolumeUSDC += _dealVolume;
        p.lastUpdated = block.timestamp;
        emit ProfileUpdated(_user, p.successfulDeals, p.totalDeals);
    }

    function recordSlash(address _user) external onlyAuthorized {
        profiles[_user].slashedCount++;
        profiles[_user].lastUpdated = block.timestamp;
    }

    function updateStakedAmount(address _user, uint256 _amount) external onlyAuthorized {
        profiles[_user].stakedAmount = _amount;
        profiles[_user].lastUpdated = block.timestamp;
    }

    /// @notice Records 1-5 star rating and optional USDC tip for a broker
    function recordRatingAndTip(address _broker, uint8 _stars, uint256 _tipAmount) external onlyAuthorized {
        require(_stars >= 1 && _stars <= 5, "Invalid stars: 1 to 5");
        TrustProfile storage p = profiles[_broker];
        p.totalRatingStars += _stars;
        p.ratingCount++;
        p.totalTipsReceived += _tipAmount;
        p.lastUpdated = block.timestamp;
        emit RatingRecorded(_broker, _stars, _tipAmount, p.totalRatingStars, p.ratingCount);
    }

    /// @notice Returns average rating scaled by 10 (e.g. 48 = 4.8 stars), total review count, and total tips
    function getBrokerRating(address _broker) external view returns (uint256 averageRatingX10, uint256 count, uint256 totalTips) {
        TrustProfile storage p = profiles[_broker];
        count = p.ratingCount;
        totalTips = p.totalTipsReceived;
        if (count == 0) {
            averageRatingX10 = 0;
        } else {
            averageRatingX10 = (p.totalRatingStars * 10) / count;
        }
    }

    /// @notice Computes success rate in basis points (e.g. 9850 = 98.50%)
    function getSuccessRate(address _user) external view returns (uint256) {
        TrustProfile storage p = profiles[_user];
        if (p.totalDeals == 0) return 0;
        return (p.successfulDeals * 10000) / p.totalDeals;
    }

    function getProfile(address _user) external view returns (TrustProfile memory) {
        return profiles[_user];
    }
}
