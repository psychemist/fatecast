import { ethers } from 'ethers';
import logger from './utils/logger';
import { getPredictionMarket } from './utils/contracts';
import { getAllPrices, calculateTargetPrice, toPythInt64 } from './utils/pyth';
import config, { pythFeeds } from './config';

export interface EventTemplate {
  question: string;
  feedKey: string;
  percentageChange: number;
  durationDays: number;
}

// Predefined event templates
const EVENT_TEMPLATES: EventTemplate[] = [
  {
    question: 'Will BTC reach $[TARGET] by [DATE]?',
    feedKey: 'BTC_USD',
    percentageChange: 10,
    durationDays: 7,
  },
  {
    question: 'Will BTC fall below $[TARGET] by [DATE]?',
    feedKey: 'BTC_USD',
    percentageChange: -5,
    durationDays: 3,
  },
  {
    question: 'Will ETH surpass $[TARGET] by [DATE]?',
    feedKey: 'ETH_USD',
    percentageChange: 15,
    durationDays: 14,
  },
  {
    question: 'Will ETH drop below $[TARGET] by [DATE]?',
    feedKey: 'ETH_USD',
    percentageChange: -10,
    durationDays: 7,
  },
  {
    question: 'Will SOL reach $[TARGET] by [DATE]?',
    feedKey: 'SOL_USD',
    percentageChange: 20,
    durationDays: 7,
  },
  {
    question: 'Will SOL trade below $[TARGET] by [DATE]?',
    feedKey: 'SOL_USD',
    percentageChange: -8,
    durationDays: 5,
  },
];

// Track events created today
let eventsCreatedToday = 0;
let lastResetDate = new Date().toDateString();

function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    eventsCreatedToday = 0;
    lastResetDate = today;
    logger.info('Daily event counter reset');
  }
}

/**
 * Create a formatted event question with actual values
 */
function formatEventQuestion(
  template: string,
  targetPrice: number,
  deadline: Date
): string {
  return template
    .replace('[TARGET]', `$${targetPrice.toLocaleString()}`)
    .replace('[DATE]', deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
}

/**
 * Select a random event template
 */
function selectRandomTemplate(): EventTemplate {
  return EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
}

/**
 * Create a single prediction event
 */
export async function createPredictionEvent(): Promise<string | null> {
  try {
    resetDailyCounter();

    // Check daily limit
    if (eventsCreatedToday >= config.maxEventsPerDay) {
      logger.warn(`Daily event limit reached (${config.maxEventsPerDay})`);
      return null;
    }

    // Get current prices
    logger.info('Fetching current prices...');
    const prices = await getAllPrices();

    // Select random template
    const template = selectRandomTemplate();
    logger.info(`Selected template: ${template.question}`);

    // Get current price for the feed
    const currentPrice = prices[template.feedKey];
    if (!currentPrice) {
      logger.error(`No price available for ${template.feedKey}`);
      return null;
    }

    // Calculate target price
    const targetPrice = calculateTargetPrice(currentPrice, template.percentageChange);
    const targetPriceInt64 = toPythInt64(targetPrice);

    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + template.durationDays);
    const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);

    // Format question
    const question = formatEventQuestion(template.question, targetPrice, deadline);

    // Get feed ID
    const feedConfig = pythFeeds[template.feedKey];
    if (!feedConfig) {
      logger.error(`Feed configuration not found for ${template.feedKey}`);
      return null;
    }

    logger.info('Creating event with params:', {
      question,
      feedId: feedConfig.id,
      currentPrice: currentPrice.toFixed(2),
      targetPrice: targetPrice.toFixed(2),
      targetPriceInt64: targetPriceInt64.toString(),
      deadline: deadline.toISOString(),
      deadlineTimestamp,
    });

    // Create event on-chain
    const market = getPredictionMarket();
    const tx = await market.createEvent(
      question,
      feedConfig.id,
      targetPriceInt64,
      deadlineTimestamp
    );

    logger.info(`Event creation transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    logger.info(`Event created successfully in block ${receipt.blockNumber}`);

    // Find EventCreated event in receipt
    const eventLog = receipt.logs.find((log: any) => {
      try {
        const parsed = market.interface.parseLog(log);
        return parsed?.name === 'EventCreated';
      } catch {
        return false;
      }
    });

    if (eventLog) {
      const parsed = market.interface.parseLog(eventLog);
      const eventId = parsed?.args[0].toString();
      logger.info(`Event ID: ${eventId}`);
      eventsCreatedToday++;
      return eventId;
    }

    logger.warn('Event created but could not extract event ID from logs');
    eventsCreatedToday++;
    return 'unknown';
  } catch (error: any) {
    logger.error('Error creating event:', {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Create multiple events in a batch
 */
export async function createBatchEvents(count: number): Promise<string[]> {
  const eventIds: string[] = [];

  for (let i = 0; i < count; i++) {
    resetDailyCounter();

    if (eventsCreatedToday >= config.maxEventsPerDay) {
      logger.warn('Daily limit reached, stopping batch creation');
      break;
    }

    logger.info(`Creating event ${i + 1}/${count}...`);
    const eventId = await createPredictionEvent();

    if (eventId) {
      eventIds.push(eventId);
    }

    // Add delay between events to avoid nonce issues
    if (i < count - 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  logger.info(`Batch creation complete. Created ${eventIds.length} events.`);
  return eventIds;
}
