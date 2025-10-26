export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as `0x${string}`;
export const PYUSD_ADDRESS = process.env.NEXT_PUBLIC_PYUSD_ADDRESS as `0x${string}`;
export const PYTH_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS as `0x${string}`;

export const PREDICTION_MARKET_ABI = [
  {
    type: 'function',
    name: 'getActiveEvents',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'eventCounter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getEvent',
    stateMutability: 'view',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'question', type: 'string' },
          { name: 'pythFeedId', type: 'bytes32' },
          { name: 'targetPrice', type: 'int64' },
          { name: 'deadline', type: 'uint256' },
          { name: 'totalYes', type: 'uint256' },
          { name: 'totalNo', type: 'uint256' },
          { name: 'totalPool', type: 'uint256' },
          { name: 'resolved', type: 'bool' },
          { name: 'outcome', type: 'bool' },
          { name: 'creator', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getUserBet',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'eventId', type: 'uint256' },
    ],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'prediction', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'calculatePotentialWinnings',
    stateMutability: 'view',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'hasClaimedWinnings',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'eventId', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'minBetAmount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'maxBetAmount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'enterMarket',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'prediction', type: 'bool' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimWinnings',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'eventId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export const PYUSD_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

// Event signature hashes for Blockscout filtering
export const EVENT_SIGNATURES = {
  EventCreated: '0xe1b607718b40444e281a43eda524e7e4f4f9b726a3f61217584e6d552c3ff305',
  EnteredMarket: '0x8e0b5a5d9c5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f', // Placeholder - update with actual
  EventResolved: '0x9e0b5a5d9c5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f', // Placeholder - update with actual
  WinningsClaimed: '0xae0b5a5d9c5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f5e5c5d5e5f', // Placeholder - update with actual
};
