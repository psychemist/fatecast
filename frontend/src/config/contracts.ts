export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as `0x${string}`;
export const PYUSD_ADDRESS = process.env.NEXT_PUBLIC_PYUSD_ADDRESS as `0x${string}`;
export const PYTH_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS as `0x${string}`;

export const PREDICTION_MARKET_ABI = [
  // Events
  'event EventCreated(uint256 indexed eventId, string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline, address indexed creator)',
  'event EnteredMarket(uint256 indexed eventId, address indexed user, bool prediction, uint256 amount)',
  'event EventResolved(uint256 indexed eventId, bool outcome, int64 finalPrice)',
  'event WinningsClaimed(uint256 indexed eventId, address indexed user, uint256 amount)',
  
  // Read functions
  'function getEvent(uint256 eventId) view returns (uint256 id, string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline, uint256 totalYes, uint256 totalNo, uint256 totalPool, bool resolved, bool outcome, address creator, uint256 createdAt)',
  'function getUserBet(address user, uint256 eventId) view returns (uint256 amount, bool prediction)',
  'function getActiveEvents() view returns (uint256[])',
  'function eventCounter() view returns (uint256)',
  'function calculatePotentialWinnings(uint256 eventId, address user) view returns (uint256)',
  'function hasClaimedWinnings(address user, uint256 eventId) view returns (bool)',
  'function minBetAmount() view returns (uint256)',
  'function maxBetAmount() view returns (uint256)',
  
  // Write functions
  'function createEvent(string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline) returns (uint256)',
  'function enterMarket(uint256 eventId, bool prediction, uint256 amount)',
  'function resolveEvent(uint256 eventId)',
  'function claimWinnings(uint256 eventId)',
] as const;

export const PYUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
] as const;

// Event signature hashes for Blockscout filtering
export const EVENT_SIGNATURES = {
  EventCreated: '0xe1b607718b40444e281a43eda524e7e4f4f9b726a3f61217584e6d552c3ff305',
  EnteredMarket: '0x8e0b5a5d9c5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f', // Placeholder - update with actual
  EventResolved: '0x9e0b5a5d9c5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f', // Placeholder - update with actual
  WinningsClaimed: '0xae0b5a5d9c5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f', // Placeholder - update with actual
};
