import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import logger from './utils/logger';
import { getPredictionMarket } from './utils/contracts';
import { getAllPrices, calculateTargetPrice, toPythInt64 } from './utils/pyth';
import { generateEventIdeas, analyzeMarketTrends } from './utils/asiOne';
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
 * Create an event using ASI:One AI-generated prediction
 */
export async function createAsiPoweredEvent(): Promise<string | null> {
  try {
    logger.info('Creating ASI-powered event...');

    // Get current prices
    const prices = await getAllPrices();

    // Get existing events to avoid duplicates
    const market = getPredictionMarket();
    const activeEventIds = await market.getActiveEvents();
    const existingQuestions: string[] = [];
    
    // Note: We can't fetch event details due to the struct decoding issue
    // So we'll just pass empty array for now
    logger.info(`Found ${activeEventIds.length} active events (skipping details due to decoding issue)`);

    // Ask ASI:One to generate event ideas
    logger.info('Asking ASI:One to generate prediction ideas...');
    const ideas = await generateEventIdeas(
      {
        'BTC': prices.BTC_USD,
        'ETH': prices.ETH_USD,
        'SOL': prices.SOL_USD,
      },
      existingQuestions
    );

    // Persist raw ASI responses for debugging (append)
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      const outPath = path.join(logsDir, 'asi_responses.log');
      const toWrite = `${new Date().toISOString()} | ${JSON.stringify(ideas)}\n`;
      fs.appendFileSync(outPath, toWrite);
    } catch (e) {
      logger.warn('Could not write ASI response to disk', (e as any).message);
    }
    
    if (ideas.length === 0) {
      logger.warn('ASI:One returned no event ideas');
      return null;
    }

    // Pick the first idea
    const question = ideas[0];
    logger.info(`ASI:One suggested: "${question}"`);

    // Parse the question to extract asset, target price, and deadline
    const parsed = parseAsiQuestion(question, {
      BTC_USD: prices.BTC_USD,
      ETH_USD: prices.ETH_USD,
      SOL_USD: prices.SOL_USD,
    });

    if (!parsed) {
      logger.warn('Could not fully parse ASI question; attempting heuristic fallback');
      // Heuristic fallback: try to infer asset only and build a reasonable event
      const assetGuess = guessAssetFromText(question);
      if (!assetGuess) {
        logger.error('Could not guess asset from ASI question; aborting creation');
        return null;
      }

      const feedKey = `${assetGuess}_USD` as keyof typeof pythFeeds;
      const current = prices[feedKey];
      if (!current) {
        logger.error('No current price available for guessed asset; aborting');
        return null;
      }

      // Default heuristic: target = current * 1.10 (10% move), duration 7 days
      const heuristicTarget = Number((current * 1.1).toFixed(6));
      const heuristicDuration = 7;

      logger.info('Heuristic event:', { assetGuess, heuristicTarget, heuristicDuration });

      // Use the original question text but append a clarifying suffix so users see it was inferred
      const fallbackQuestion = `${question} (inferred target $${heuristicTarget} in ${heuristicDuration} days)`;

      // Create the event with heuristics below
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + heuristicDuration);
      const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
      const targetPriceInt64 = toPythInt64(heuristicTarget);

      logger.info('Creating ASI-inferred event with params:', {
        question: fallbackQuestion,
        feedId: pythFeeds[feedKey].id,
        targetPrice: heuristicTarget,
        targetPriceInt64,
        deadline: deadline.toISOString(),
        deadlineTimestamp,
      });

      const tx = await market.createEvent(
        fallbackQuestion,
        pythFeeds[feedKey].id,
        targetPriceInt64,
        deadlineTimestamp
      );

      logger.info(`Event creation transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      logger.info(`ASI-powered event (heuristic) created successfully in block ${receipt.blockNumber}`);

      const eventLog = receipt.logs.find((log: any) => {
        try {
          const parsed = market.interface.parseLog(log);
          return parsed?.name === 'EventCreated';
        } catch {
          return false;
        }
      });

      if (eventLog) {
        const parsedLog = market.interface.parseLog(eventLog);
        const eventId = parsedLog?.args[0].toString();
        logger.info(`✅ ASI-powered (heuristic) Event ID: ${eventId}`);
        eventsCreatedToday++;
        return eventId;
      }

      eventsCreatedToday++;
      return 'unknown';
    }

    const { asset, targetPrice, durationDays } = parsed;
    const feedKey = `${asset}_USD` as keyof typeof pythFeeds;
    
    if (!pythFeeds[feedKey]) {
      logger.warn(`Unknown asset ${asset}, falling back`);
      return null;
    }

    // Create the event
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + durationDays);
    const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);

    const targetPriceInt64 = toPythInt64(targetPrice);

    logger.info('Creating ASI-generated event with params:', {
      question,
      feedId: pythFeeds[feedKey].id,
      targetPrice,
      targetPriceInt64,
      deadline: deadline.toISOString(),
      deadlineTimestamp,
    });

    const tx = await market.createEvent(
      question,
      pythFeeds[feedKey].id,
      targetPriceInt64,
      deadlineTimestamp
    );

    logger.info(`Event creation transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    logger.info(`ASI-powered event created successfully in block ${receipt.blockNumber}`);

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
      logger.info(`✅ ASI-powered Event ID: ${eventId}`);
      eventsCreatedToday++;
      return eventId;
    }

    eventsCreatedToday++;
    return 'unknown';
  } catch (error: any) {
    logger.error('Error creating ASI-powered event:', {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Parse ASI:One generated question
 * Example: "Will BTC reach $120,000 by November 10th?"
 */
function parseAsiQuestion(
  question: string,
  currentPrices: Record<string, number>
): { asset: string; targetPrice: number; durationDays: number } | null {
  try {
    const q = question.trim();
    const qLower = q.toLowerCase();

    // Asset detection
    const asset = guessAssetFromText(q);
    if (!asset) return null;

    // Price detection: prefer $... pattern, otherwise look for plain number patterns
    let targetPrice: number | null = null;
    const dollarMatch = q.match(/\$\s*[\d,]+(?:\.\d+)?/);
    if (dollarMatch) {
      targetPrice = parseFloat(dollarMatch[0].replace(/[$,\s]/g, ''));
    } else {
      // look for number sequences like 0.75 or 120000
      const numMatch = q.match(/(?<!\$)(?:\b|\s)([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d+)?|\d+\.\d+)(?:\b|\s|\?|$)/);
      if (numMatch) {
        targetPrice = parseFloat(numMatch[1].replace(/,/g, ''));
      }
    }

    if (targetPrice === null || Number.isNaN(targetPrice)) {
      // If no explicit price found, attempt a percentage-based target using verbs
      // e.g., 'surpass' or 'drop below' -> infer +/- movement
      const defaultCurrent = currentPrices[`${asset}_USD`];
      if (!defaultCurrent) return null;
      let pct = 0.1; // default 10% move
      if (qLower.includes('surpass') || qLower.includes('exceed') || qLower.includes('reach')) pct = 0.1;
      if (qLower.includes('rise') || qLower.includes('gain')) pct = 0.12;
      if (qLower.includes('fall') || qLower.includes('drop') || qLower.includes('below')) pct = -0.08;
      targetPrice = Number((defaultCurrent * (1 + pct)).toFixed(6));
    }

    // Deadline extraction: look for 'by <date>' or relative durations like 'in 7 days'
    let durationDays = 7; // default

    // 'in X days' / 'in X weeks'
    const inDaysMatch = qLower.match(/in\s+(\d+)\s+day/);
    if (inDaysMatch) {
      durationDays = parseInt(inDaysMatch[1], 10);
      return { asset, targetPrice, durationDays };
    }
    const inWeeksMatch = qLower.match(/in\s+(\d+)\s+week/);
    if (inWeeksMatch) {
      durationDays = parseInt(inWeeksMatch[1], 10) * 7;
      return { asset, targetPrice, durationDays };
    }

    if (qLower.includes('tomorrow')) {
      durationDays = 1;
      return { asset, targetPrice, durationDays };
    }

    // 'by <month name> <day>' or 'by <date>' patterns
    const byDateMatch = q.match(/by\s+([A-Za-z0-9 ,\-\.]+?)(?:\?|$)/i);
    if (byDateMatch) {
      const dateStr = byDateMatch[1].trim().replace(/(st|nd|rd|th)/i, '');
      const parsedTs = Date.parse(dateStr);
      if (!Number.isNaN(parsedTs)) {
        const now = Date.now();
        const diff = parsedTs - now;
        const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        durationDays = days;
        return { asset, targetPrice, durationDays };
      }
    }

    // fallback word-based durations
    if (qLower.includes('weekend')) durationDays = 3;
    else if (qLower.includes('week')) durationDays = 7;
    else if (qLower.includes('month')) durationDays = 30;

    return { asset, targetPrice, durationDays };
  } catch (err) {
    logger.error('Error parsing ASI question:', (err as any).message || err);
    return null;
  }
}

/**
 * Guess asset from free-form text
 */
function guessAssetFromText(question: string): string | null {
  const q = question.toLowerCase();
  if (q.includes('btc') || q.includes('bitcoin')) return 'BTC';
  if (q.includes('eth') || q.includes('ethereum')) return 'ETH';
  if (q.includes('sol') || q.includes('solana')) return 'SOL';
  if (q.includes('xrp') || q.includes('ripple')) return 'XRP';
  return null;
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
    const eventId = await createAsiPoweredEvent();
    // const eventId = await createPredictionEvent();

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
