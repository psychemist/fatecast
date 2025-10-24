#!/usr/bin/env ts-node

import logger from './utils/logger';
import { validateConfig } from './config';
import { initializeContracts, checkBalance } from './utils/contracts';
import { getActiveEvents, getEventDetails } from './eventResolver';
import { getAllPrices } from './utils/pyth';

async function main() {
  try {
    logger.info('========================================');
    logger.info('Fatecast Agent Monitor');
    logger.info('========================================');

    // Validate and initialize
    validateConfig();
    initializeContracts();

    // Check wallet balance
    const balance = await checkBalance();
    logger.info(`Agent Wallet Balance: ${balance} ETH`);

    // Get current prices
    logger.info('\n📊 Current Prices:');
    const prices = await getAllPrices();
    Object.entries(prices).forEach(([key, price]) => {
      logger.info(`  ${key}: $${price.toFixed(2)}`);
    });

    // Get active events
    logger.info('\n📋 Active Events:');
    const eventIds = await getActiveEvents();

    if (eventIds.length === 0) {
      logger.info('  No active events');
    } else {
      for (const eventId of eventIds) {
        const event = await getEventDetails(eventId);
        if (event) {
          const deadline = new Date(event.deadline * 1000);
          const now = new Date();
          const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 3600000));

          logger.info(`\n  Event #${eventId}:`);
          logger.info(`    Question: ${event.question}`);
          logger.info(`    Deadline: ${deadline.toLocaleString()}`);
          logger.info(`    Time Remaining: ${hoursRemaining} hours`);
          logger.info(`    Status: ${event.resolved ? '✅ Resolved' : '⏳ Pending'}`);
        }
      }
    }

    logger.info('\n========================================');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

main();
