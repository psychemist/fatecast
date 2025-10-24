import axios from 'axios';
import config, { pythFeeds } from '../config';
import logger from './logger';

export interface PythPrice {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

export interface PythPriceResponse {
  binary: {
    encoding: string;
    data: string[];
  };
  parsed: PythPrice[];
}

/**
 * Fetch current price from Pyth Hermes API
 */
export async function fetchPythPrice(feedId: string): Promise<PythPrice | null> {
  try {
    const url = `${config.pythHermesUrl}/api/latest_price_feeds?ids[]=${feedId}`;
    
    logger.debug(`Fetching price from Pyth: ${url}`);
    
    const response = await axios.get<PythPrice[]>(url);
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    logger.warn(`No price data returned for feed ${feedId}`);
    return null;
  } catch (error) {
    logger.error(`Error fetching Pyth price for ${feedId}:`, error);
    return null;
  }
}

/**
 * Get human-readable price from Pyth data
 */
export function formatPythPrice(priceData: PythPrice): number {
  const price = parseInt(priceData.price.price);
  const expo = priceData.price.expo;
  return price * Math.pow(10, expo);
}

/**
 * Get price for a specific feed ID with retry logic
 */
export async function getPriceWithRetry(
  feedId: string,
  maxRetries = 3
): Promise<number | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const priceData = await fetchPythPrice(feedId);
      if (priceData) {
        const price = formatPythPrice(priceData);
        logger.info(`Fetched price for ${feedId}: $${price.toFixed(2)}`);
        return price;
      }
    } catch (error) {
      logger.warn(`Retry ${i + 1}/${maxRetries} failed for ${feedId}`);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  logger.error(`Failed to fetch price for ${feedId} after ${maxRetries} retries`);
  return null;
}

/**
 * Get all available feed prices
 */
export async function getAllPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  for (const [key, feed] of Object.entries(pythFeeds)) {
    const price = await getPriceWithRetry(feed.id);
    if (price !== null) {
      prices[key] = price;
    }
  }
  
  return prices;
}

/**
 * Calculate a reasonable target price based on current price
 */
export function calculateTargetPrice(
  currentPrice: number,
  percentageChange: number
): number {
  return currentPrice * (1 + percentageChange / 100);
}

/**
 * Format price to Pyth's int64 format (with 8 decimals)
 */
export function toPythInt64(price: number): bigint {
  // Pyth uses 8 decimal places for most price feeds
  return BigInt(Math.floor(price * 1e8));
}
