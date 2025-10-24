#!/usr/bin/env ts-node

import logger from './utils/logger';
import { validateConfig } from './config';
import { initializeContracts, checkBalance } from './utils/contracts';
import { processResolutions } from './eventResolver';

async function main() {
  try {
    logger.info('Resolving pending events...');

    // Validate and initialize
    validateConfig();
    initializeContracts();

    const balance = await checkBalance();
    logger.info(`Wallet balance: ${balance} ETH`);

    // Process all resolutions
    const resolvedCount = await processResolutions();

    if (resolvedCount > 0) {
      logger.info(`✅ Successfully resolved ${resolvedCount} event(s)`);
    } else {
      logger.info('ℹ️  No events were resolved');
    }

    process.exit(0);
  } catch (error: any) {
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

main();
