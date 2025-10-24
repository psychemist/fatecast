import cron from 'node-cron';
import logger from './utils/logger';
import config, { validateConfig } from './config';
import { initializeContracts, checkBalance } from './utils/contracts';
import { createPredictionEvent } from './eventCreator';
import { processResolutions, startResolutionMonitor } from './eventResolver';

async function main() {
  try {
    logger.info('========================================');
    logger.info('Fatecast ASI Agent Starting...');
    logger.info('========================================');

    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration valid');

    // Initialize blockchain connection
    initializeContracts();

    // Check wallet balance
    const balance = await checkBalance();
    logger.info(`Agent wallet balance: ${balance} ETH`);

    if (parseFloat(balance) < 0.01) {
      logger.warn('⚠️  Low wallet balance! Please fund the agent wallet.');
    }

    logger.info('========================================');
    logger.info('Agent Configuration:');
    logger.info(`Network: ${config.network}`);
    logger.info(`Chain ID: ${config.chainId}`);
    logger.info(`PredictionMarket: ${config.predictionMarketAddress}`);
    logger.info(`Event Creation Interval: ${config.eventCreationInterval}ms (${config.eventCreationInterval / 3600000}h)`);
    logger.info(`Event Resolution Interval: ${config.eventResolutionInterval}ms (${config.eventResolutionInterval / 60000}min)`);
    logger.info(`Max Events Per Day: ${config.maxEventsPerDay}`);
    logger.info('========================================');

    // Start resolution monitor (runs every 5 minutes by default)
    logger.info('Starting event resolution monitor...');
    startResolutionMonitor(config.eventResolutionInterval);

    // Schedule event creation (every hour by default)
    logger.info('Scheduling event creation...');
    const cronSchedule = `*/${Math.floor(config.eventCreationInterval / 60000)} * * * *`;
    cron.schedule(cronSchedule, async () => {
      try {
        logger.info('Running scheduled event creation...');
        await createPredictionEvent();
      } catch (error: any) {
        logger.error('Error in scheduled event creation:', error.message);
      }
    });

    logger.info('✅ Agent is running!');
    logger.info('Press Ctrl+C to stop');

    // Keep the process alive
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('Fatal error:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run the agent
main();
