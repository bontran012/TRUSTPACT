// TrustPact Contract Addresses and Interfaces for Avalanche Fuji C-Chain & Custom L1

export const NETWORK_CONFIG = {
  chainId: 43113,
  chainName: "Avalanche Fuji Testnet",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  explorerUrl: "https://testnet.snowtrace.io",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
};

export const CONTRACT_ADDRESSES = {
  universalEscrow: process.env.NEXT_PUBLIC_UNIVERSAL_ESCROW || "0x51E2b1239c09d57aC7bAfF094553b6A1B022B854",
  stakedBrokerRegistry: process.env.NEXT_PUBLIC_BROKER_REGISTRY || "0x39Aa21F51E2b1239c09d57aC7bAfF094553b6A1B",
  trustPassportSBT: process.env.NEXT_PUBLIC_TRUST_PASSPORT_SBT || "0x789C21F51E2b1239c09d57aC7bAfF094553b6A1C",
  scamRegistryL1: process.env.NEXT_PUBLIC_SCAM_REGISTRY_L1 || "0x987D21F51E2b1239c09d57aC7bAfF094553b6A1D",
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65", // Fuji Circle USDC
};

export const UNIVERSAL_ESCROW_ABI = [
  "function createEscrow(address payable _seller, address _broker, uint256 _amount, uint256 _duration, uint256 _brokerFeeBps) external returns (uint256)",
  "function brokerRelease(uint256 _id) external",
  "function buyerConfirmDelivery(uint256 _id) external",
  "function brokerRefundBuyer(uint256 _id) external",
  "function brokerSettle(uint256 _id, uint256 _refundToBuyer, uint256 _payoutToSeller) external",
  "function buyerClaimExpiredRefund(uint256 _id) external",
  "function mutualCancelEscrow(uint256 _id) external",
  "function rateAndTip(uint256 _id, uint8 _stars, uint256 _tipAmount) external",
  "function getEscrow(uint256 _id) external view returns (tuple(uint256 id, address buyer, address seller, address broker, uint256 amount, uint256 brokerFeeBps, uint256 duration, uint256 startTime, uint8 status))",
  "function isRated(uint256 _id) external view returns (bool)",
  "function isExpired(uint256 _id) external view returns (bool)",
  "event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, address broker, uint256 amount, uint256 brokerFeeBps)",
  "event BrokerReleased(uint256 indexed id)",
  "event BuyerConfirmedDelivery(uint256 indexed id)",
  "event RefundExecuted(uint256 indexed id, uint256 amount)",
  "event EscrowRated(uint256 indexed id, address indexed broker, address indexed buyer, uint8 stars, uint256 tipAmount)"
];

export const TRUST_PASSPORT_SBT_ABI = [
  "function getProfile(address _user) external view returns (tuple(uint256 successfulDeals, uint256 totalDeals, uint256 totalVolumeUSDC, uint256 stakedAmount, uint256 slashedCount, uint256 lastUpdated, uint256 totalRatingStars, uint256 ratingCount, uint256 totalTipsReceived))",
  "function getBrokerRating(address _broker) external view returns (uint256 averageRatingX10, uint256 count, uint256 totalTips)",
  "function getSuccessRate(address _user) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "event RatingRecorded(address indexed broker, uint8 stars, uint256 tipAmount, uint256 newTotalStars, uint256 newRatingCount)"
];

export const STAKED_BROKER_REGISTRY_ABI = [
  "function stakeInsurance(uint256 _amount) external",
  "function unstakeInsurance(uint256 _amount) external",
  "function getProfile(address _broker) external view returns (tuple(uint256 stakedBalance, uint256 principalDeposited, uint256 activeHoldingAllocated, uint256 successfulDeals, uint256 lastStakeTimestamp, uint256 lastActiveTimestamp, bool isVerified, bool isBlacklisted))",
  "function getAvailableQuota(address _broker) external view returns (uint256)",
  "function getEstimatedYield(address _broker) external view returns (uint256)",
  "function isBrokerVerified(address _broker) external view returns (bool)"
];

export const SCAM_REGISTRY_L1_ABI = [
  "function reportScam(uint8 _idType, string calldata _identifier, string calldata _evidenceIPFS, string calldata _victimNote) external returns (uint256)",
  "function checkScam(uint8 _idType, string calldata _identifier) external view returns (tuple(uint256 reportCount, uint256 verifiedCount, bool isFlagged))",
  "function getReports(uint8 _idType, string calldata _identifier) external view returns (tuple(address reporter, uint8 idType, string identifier, string evidenceIPFS, string victimNote, uint256 timestamp, bool isVerified)[])"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];
