// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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

    function mintPassport(address _user) external onlyAuthorized returns (uint256) {
        require(_user != address(0), "Zero address");
        require(balanceOf(_user) == 0, "Already has passport");
        _tokenIdCounter++;
        emit PassportMinted(_user, _tokenIdCounter);
        _safeMint(_user, _tokenIdCounter);
        return _tokenIdCounter;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        address user = ownerOf(tokenId);
        TrustProfile memory p = profiles[user];
        uint256 successRate = p.totalDeals == 0 ? 100 : (p.successfulDeals * 100) / p.totalDeals;
        string memory badge = p.slashedCount > 0
            ? "Slashed"
            : (p.totalDeals >= 100 ? "Master Escrow" : (p.totalDeals >= 20 ? "Verified Broker" : "Member"));

        string memory svg = Base64.encode(
            bytes(
                string.concat(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" rx="18" fill="#0B1938"/><text x="24" y="42" fill="#38BDF8" font-family="monospace" font-size="14" font-weight="bold">TRUSTPACT SOULBOUND PASSPORT #',
                    Strings.toString(tokenId),
                    '</text><text x="24" y="88" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="bold">',
                    badge,
                    '</text><text x="24" y="136" fill="#34D399" font-family="monospace" font-size="15">Success Rate: ',
                    Strings.toString(successRate),
                    '% (',
                    Strings.toString(p.successfulDeals),
                    '/',
                    Strings.toString(p.totalDeals),
                    ' deals)</text><text x="24" y="172" fill="#FBBF24" font-family="monospace" font-size="14">Staked Bond: ',
                    Strings.toString(p.stakedAmount / 1e6),
                    ' USDC</text><text x="24" y="208" fill="#94A3B8" font-family="monospace" font-size="11">Avalanche C-Chain Non-Transferable ERC-721</text></svg>'
                )
            )
        );

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "TrustPassport #',
                    Strings.toString(tokenId),
                    '", "description": "TrustPact Soulbound Reputation Passport on Avalanche", ',
                    '"image": "data:image/svg+xml;base64,',
                    svg,
                    '", "attributes": [',
                    '{"trait_type": "Success Rate", "value": "',
                    Strings.toString(successRate),
                    '%"}, ',
                    '{"trait_type": "Total Deals", "value": ',
                    Strings.toString(p.totalDeals),
                    '}, ',
                    '{"trait_type": "Successful Deals", "value": ',
                    Strings.toString(p.successfulDeals),
                    '}, ',
                    '{"trait_type": "Tier Badge", "value": "',
                    badge,
                    '"}',
                    ']}'
                )
            )
        );
        return string.concat("data:application/json;base64,", json);
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
