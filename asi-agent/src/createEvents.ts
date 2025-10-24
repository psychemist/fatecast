#!/usr/bin/env ts-node

import logger from './utils/logger';
import { validateConfig } from './config';
import { initializeContracts, checkBalance } from './utils/contracts';
import { createPredictionEvent, createBatchEvents } from './eventCreator';

async function main() {
  try {
    logger.info('Creating prediction events...');

    // Validate and initialize
    validateConfig();
    initializeContracts();

    const balance = await checkBalance();
    logger.info(`Wallet balance: ${balance} ETH`);

    // Get number of events to create from command line
    const count = process.argv[2] ? parseInt(process.argv[2]) : 1;

    if (count < 1 || count > 10) {
      logger.error('Invalid count. Please specify between 1 and 10 events.');
      process.exit(1);
    }

    logger.info(`Creating ${count} event(s)...`);

    if (count === 1) {
      const eventId = await createPredictionEvent();
      if (eventId) {
        logger.info(`✅ Successfully created event: ${eventId}`);
      } else {
        logger.error('❌ Failed to create event');
        process.exit(1);
      }
    } else {
      const eventIds = await createBatchEvents(count);
      logger.info(`✅ Successfully created ${eventIds.length} events`);
      eventIds.forEach((id, i) => {
        logger.info(`  ${i + 1}. Event ID: ${id}`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

main();
