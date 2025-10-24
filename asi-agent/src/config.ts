import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface AgentConfig {
  network: string;
  rpcUrl: string;
  chainId: number;
  agentPrivateKey: string;
  predictionMarketAddress: string;
  pyusdAddress: string;
  pythOracleAddress: string;
  pythHermesUrl: string;
  pythNetwork: string;
  eventCreationInterval: number;
  eventResolutionInterval: number;
  maxEventsPerDay: number;
  minEventDuration: number;
  maxEventDuration: number;
  logLevel: string;
  logFile: string;
}

export interface PythFeedConfig {
  id: string;
  symbol: string;
  description: string;
}

export const config: AgentConfig = {
  network: process.env.NETWORK || 'sepolia',
  rpcUrl: process.env.RPC_URL || '',
  chainId: parseInt(process.env.CHAIN_ID || '11155111'),
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || '',
  predictionMarketAddress: process.env.PREDICTION_MARKET_ADDRESS || '',
  pyusdAddress: process.env.PYUSD_ADDRESS || '',
  pythOracleAddress: process.env.PYTH_ORACLE_ADDRESS || '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21',
  pythHermesUrl: process.env.PYTH_HERMES_URL || 'https://hermes.pyth.network',
  pythNetwork: process.env.PYTH_NETWORK || 'sepolia',
  eventCreationInterval: parseInt(process.env.EVENT_CREATION_INTERVAL || '3600000'), // 1 hour
  eventResolutionInterval: parseInt(process.env.EVENT_RESOLUTION_INTERVAL || '300000'), // 5 minutes
  maxEventsPerDay: parseInt(process.env.MAX_EVENTS_PER_DAY || '10'),
  minEventDuration: parseInt(process.env.MIN_EVENT_DURATION || '86400'), // 1 day in seconds
  maxEventDuration: parseInt(process.env.MAX_EVENT_DURATION || '2592000'), // 30 days in seconds
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/agent.log',
};

export const pythFeeds: Record<string, PythFeedConfig> = {
  BTC_USD: {
    id: process.env.PYTH_BTC_USD || '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    symbol: 'BTC/USD',
    description: 'Bitcoin / US Dollar',
  },
  ETH_USD: {
    id: process.env.PYTH_ETH_USD || '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    symbol: 'ETH/USD',
    description: 'Ethereum / US Dollar',
  },
  SOL_USD: {
    id: process.env.PYTH_SOL_USD || '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    symbol: 'SOL/USD',
    description: 'Solana / US Dollar',
  },
};

// Validate configuration
export function validateConfig(): void {
  const required = [
    'rpcUrl',
    'agentPrivateKey',
    'predictionMarketAddress',
    'pyusdAddress',
  ];

  const missing = required.filter((key) => !config[key as keyof AgentConfig]);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  if (!config.agentPrivateKey.startsWith('0x')) {
    throw new Error('Agent private key must start with 0x');
  }
}

export default config;
