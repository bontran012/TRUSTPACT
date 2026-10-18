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
  customL1: {
    chainId: 99943113,
    chainName: "TrustPact Zero-Gas L1 Subnet",
    rpcUrl: "http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc",
  },
};
export const CONTRACT_ADDRESSES = {
  universalEscrow: process.env.NEXT_PUBLIC_UNIVERSAL_ESCROW || "0x51E2b1239c09d57aC7bAfF094553b6A1B022B854",
  stakedBrokerRegistry: process.env.NEXT_PUBLIC_BROKER_REGISTRY || "0x39Aa21F51E2b1239c09d57aC7bAfF094553b6A1B",
  trustPassportSBT: process.env.NEXT_PUBLIC_TRUST_PASSPORT_SBT || "0x789C21F51E2b1239c09d57aC7bAfF094553b6A1C",
  scamRegistryL1: process.env.NEXT_PUBLIC_SCAM_REGISTRY_L1 || "0x52C84043CD9c86523674805113B78444499cB73a",
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65",
  aaveV3Pool: process.env.NEXT_PUBLIC_FUJI_AAVE_V3_POOL || "0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40",
};
export const UNIVERSAL_ESCROW_ABI = [
  "function createEscrow(address payable _seller, address _broker, uint256 _amount, uint256 _duration, uint256 _brokerFeeBps) external returns (uint256)",
  "function brokerRelease(uint256 _id) external",
  "function buyerConfirmDelivery(uint256 _id) external",
  "function brokerRefundBuyer(uint256 _id) external",
  "function brokerSettle(uint256 _id, uint256 _refundToBuyer, uint256 _payoutToSeller) external",
  "function buyerClaimExpiredRefund(uint256 _id) external",
  "function mutualCancelEscrow(uint256 _id) external",
  "function adminSlashCorruptBroker(uint256 _id, uint256 _compensation) external",
  "function rateAndTip(uint256 _id, uint8 _stars, uint256 _tipAmount) external",
  "function getEscrow(uint256 _id) external view returns (tuple(uint256 id, address buyer, address seller, address broker, uint256 amount, uint256 brokerFeeBps, uint256 duration, uint256 startTime, uint8 status))",
  "function isRated(uint256 _id) external view returns (bool)",
  "function isExpired(uint256 _id) external view returns (bool)"
];
export const TRUST_PASSPORT_SBT_ABI = [
  "function getProfile(address _user) external view returns (tuple(uint256 successfulDeals, uint256 totalDeals, uint256 totalVolumeUSDC, uint256 stakedAmount, uint256 slashedCount, uint256 lastUpdated, uint256 totalRatingStars, uint256 ratingCount, uint256 totalTipsReceived))",
  "function getBrokerRating(address _broker) external view returns (uint256 averageRatingX10, uint256 count, uint256 totalTips)",
  "function getSuccessRate(address _user) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)"
];
export const STAKED_BROKER_REGISTRY_ABI = [
  "function stakeInsurance(uint256 _amount) external",
  "function unstakeInsurance(uint256 _amount) external",
  "function getProfile(address _broker) external view returns (tuple(uint256 principalDeposited, uint256 stakedBalance, uint256 activeHoldingAllocated, uint256 successfulDeals, uint256 totalDeals, uint256 slashedCount, bool isVerified, bool isBlacklisted, uint256 lastActiveTimestamp))",
  "function getAvailableQuota(address _broker) external view returns (uint256)",
  "function getEstimatedYield(address _broker) external view returns (uint256)",
  "function getTotalAccruedYield() external view returns (uint256)",
  "function isBrokerVerified(address _broker) external view returns (bool)"
];
export const SCAM_REGISTRY_L1_ABI = [
  "function reportScam(string calldata _identifier, string calldata _category, string calldata _evidenceHash, string calldata _description) external",
  "function checkScam(string calldata _identifier) external view returns (uint256 count, bool hasVerified)",
  "function getReports(string calldata _identifier) external view returns (tuple(address reporter, string identifier, string category, string evidenceHash, string description, uint256 timestamp, bool isVerified)[])",
  "function verifyReport(string calldata _identifier, uint256 _index) external",
  "function totalReports() external view returns (uint256)"
];
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];
