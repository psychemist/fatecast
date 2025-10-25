import { ethers } from 'ethers';
import config from '../config';
import logger from './logger';

// ABI excerpts for the contracts we need to interact with
export const PREDICTION_MARKET_ABI = [
  'function createEvent(string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline) returns (uint256)',
  'function resolveEvent(uint256 eventId)',
  'function getEvent(uint256 eventId) view returns (uint256 id, string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline, uint256 totalYes, uint256 totalNo, uint256 totalPool, bool resolved, bool outcome, address creator, uint256 createdAt)',
  'function getActiveEvents() view returns (uint256[])',
  'function eventCounter() view returns (uint256)',
  'event EventCreated(uint256 indexed eventId, string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline, address indexed creator)',
  'event EventResolved(uint256 indexed eventId, bool outcome, int64 finalPrice)',
];

export const PYUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
];

export const PYTH_ORACLE_ABI = [
  'function getPrice(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))',
  'function getPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))',
];

let provider: ethers.Provider;
let wallet: ethers.Wallet;
let predictionMarket: ethers.Contract;
let pyusd: ethers.Contract;
let pythOracle: ethers.Contract;

export function initializeContracts() {
  logger.info('Initializing blockchain connection...');

  // Create provider
  provider = new ethers.JsonRpcProvider(config.rpcUrl);

  // Create wallet
  wallet = new ethers.Wallet(config.agentPrivateKey, provider);
  logger.info(`Agent wallet address: ${wallet.address}`);

  // Initialize contracts
  predictionMarket = new ethers.Contract(
    config.predictionMarketAddress,
    PREDICTION_MARKET_ABI,
    wallet 
  );

  pyusd = new ethers.Contract(
    config.pyusdAddress,
    PYUSD_ABI,
    wallet
  );

  pythOracle = new ethers.Contract(
    config.pythOracleAddress,
    PYTH_ORACLE_ABI,
    provider // Read-only for oracle
  );

  logger.info('Contracts initialized successfully');
}

export function getProvider(): ethers.Provider {
  return provider;
}

export function getWallet(): ethers.Wallet {
  return wallet;
}

export function getPredictionMarket(): ethers.Contract {
  return predictionMarket;
}

export function getPYUSD(): ethers.Contract {
  return pyusd;
}

export function getPythOracle(): ethers.Contract {
  return pythOracle;
}

// Helper to check wallet balance
export async function checkBalance(): Promise<string> {
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

// Helper to wait for transaction
export async function waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt | null> {
  logger.info(`Waiting for transaction ${txHash} (${confirmations} confirmations)...`);
  const receipt = await provider.waitForTransaction(txHash, confirmations);
  if (receipt) {
    logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);
  }
  return receipt;
}
