const BLOCKSCOUT_URL = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://eth-sepolia.blockscout.com';
const BLOCKSCOUT_API_URL = process.env.NEXT_PUBLIC_BLOCKSCOUT_API_URL || 'https://eth-sepolia.blockscout.com/api';

// Type definitions for our use case
interface LogParams {
  module: string;
  action: string;
  address: string;
  fromBlock: string;
  toBlock: string;
  [key: string]: string;
}

export interface BlockscoutLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

export interface BlockscoutTransaction {
  hash: string;
  blockNumber: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  nonce: string;
  timestamp: string;
  status: string;
}

/**
    const params: Params = {
 */
export async function getContractLogs(
  contractAddress: string,
  fromBlock: number | 'latest' = 0,
  toBlock: number | 'latest' = 'latest',
  topics?: string[]
): Promise<BlockscoutLog[]> {
  try {
    const params: LogParams = {
      module: 'logs',
      action: 'getLogs',
      address: contractAddress,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
    };

    if (topics && topics.length > 0) {
      topics.forEach((topic, index) => {
        params[`topic${index}`] = topic;
      });
    }

    const response = await fetch(
      `${BLOCKSCOUT_API_URL}?${new URLSearchParams(params)}`
    );
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result;
    }
    return [];
  } catch (error) {
    console.error('Error fetching contract logs:', error);
    return [];
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(txHash: string): Promise<BlockscoutTransaction | null> {
  try {
    const params = {
      module: 'transaction',
      action: 'gettxinfo',
      txhash: txHash,
    };

    const response = await fetch(
      `${BLOCKSCOUT_API_URL}?${new URLSearchParams(params)}`
    );
    const data = await response.json();

    if (data.status === '1' && data.result) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Watch for new transactions in real-time
 */
export function watchTransactions(
  contractAddress: string,
  callback: (tx: BlockscoutTransaction) => void,
  pollInterval: number = 5000
): () => void {
  let lastBlock = 0;
  
  const poll = async () => {
    try {
      const logs = await getContractLogs(contractAddress, lastBlock === 0 ? 'latest' : lastBlock);
      
      for (const log of logs) {
        const blockNum = parseInt(log.blockNumber, 16);
        if (blockNum > lastBlock) {
          const tx = await getTransaction(log.transactionHash);
          if (tx) {
            callback(tx);
          }
          lastBlock = blockNum;
        }
      }
    } catch (error) {
      console.error('Error polling transactions:', error);
    }
  };

  const interval = setInterval(poll, pollInterval);
  poll(); // Initial poll

  return () => clearInterval(interval);
}

/**
 * Get contract verification status
 */
export async function getContractVerification(contractAddress: string): Promise<boolean> {
  try {
    const params = {
      module: 'contract',
      action: 'getabi',
      address: contractAddress,
    };

    const response = await fetch(
      `${BLOCKSCOUT_API_URL}?${new URLSearchParams(params)}`
    );
    const data = await response.json();

    return data.status === '1';
  } catch (error) {
    console.error('Error checking contract verification:', error);
    return false;
  }
}

/**
 * Get Blockscout explorer URL for address
 */
export function getAddressUrl(address: string): string {
  return `${BLOCKSCOUT_URL}/address/${address}`;
}

/**
 * Get Blockscout explorer URL for transaction
 */
export function getTxUrl(txHash: string): string {
  return `${BLOCKSCOUT_URL}/tx/${txHash}`;
}

/**
 * Get Blockscout explorer URL for block
 */
export function getBlockUrl(blockNumber: number): string {
  return `${BLOCKSCOUT_URL}/block/${blockNumber}`;
}
