import logger from './utils/logger';
import { getPredictionMarket, getPythOracle } from './utils/contracts';

export interface PendingEvent {
  id: string;
  question: string;
  pythFeedId: string;
  targetPrice: bigint;
  deadline: number;
  resolved: boolean;
}

/**
 * Fetch all active unresolved events
 */
export async function getActiveEvents(): Promise<string[]> {
  try {
    const market = getPredictionMarket();
    const eventIds = await market.getActiveEvents();
    logger.info(`Found ${eventIds.length} active events`);
    return eventIds.map((id: any) => id.toString());
  } catch (error: any) {
    logger.error('Error fetching active events:', error.message);
    return [];
  }
}

/**
 * Get event details
 */
export async function getEventDetails(eventId: string): Promise<PendingEvent | null> {
  try {
    const market = getPredictionMarket();
    // Keep as string - ethers will handle the conversion
    const eventData: any = await market.getEvent(eventId);

    // Ethers v6 returns structs with both named and indexed access
    // Event struct: id, question, pythFeedId, targetPrice, deadline, totalYes, totalNo, totalPool, resolved, outcome, creator, createdAt
    return {
      id: eventId,
      question: eventData[1], // index 1
      pythFeedId: eventData[2], // index 2
      targetPrice: eventData[3], // index 3
      deadline: Number(eventData[4]), // index 4
      resolved: eventData[8], // index 8
    };
  } catch (error: any) {
    logger.error(`Error fetching event ${eventId}:`, JSON.stringify(error));
    return null;
  }
}

/**
 * Check if event is ready to be resolved
 */
export function isEventReadyForResolution(event: PendingEvent): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= event.deadline && !event.resolved;
}

/**
 * Resolve a single event
 */
export async function resolveEvent(eventId: string): Promise<boolean> {
  try {
    logger.info(`Resolving event ${eventId}...`);

    const market = getPredictionMarket();
    const tx = await market.resolveEvent(eventId);

    logger.info(`Resolution transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    logger.info(`Event ${eventId} resolved successfully in block ${receipt.blockNumber}`);

    // Find EventResolved event in receipt
    const eventLog = receipt.logs.find((log: any) => {
      try {
        const parsed = market.interface.parseLog(log);
        return parsed?.name === 'EventResolved';
      } catch {
        return false;
      }
    });

    if (eventLog) {
      const parsed = market.interface.parseLog(eventLog);
      const outcome = parsed?.args.outcome;
      const finalPrice = parsed?.args.finalPrice;
      logger.info(`Event resolved with outcome: ${outcome ? 'YES' : 'NO'}, final price: ${finalPrice.toString()}`);
    }

    return true;
  } catch (error: any) {
    logger.error(`Error resolving event ${eventId}:`, {
      message: error.message,
      reason: error.reason,
      code: error.code,
    });
    return false;
  }
}

/**
 * Process all events and resolve those that are ready
 */
export async function processResolutions(): Promise<number> {
  try {
    logger.info('Starting resolution process...');

    // Get all active events
    const eventIds = await getActiveEvents();

    if (eventIds.length === 0) {
      logger.info('No active events to check');
      return 0;
    }

    let resolvedCount = 0;

    // Check each event
    for (const eventId of eventIds) {
      logger.info(`Checking event ${eventId}...`);

      const event = await getEventDetails(eventId);
      if (!event) {
        logger.warn(`Could not fetch details for event ${eventId}`);
        continue;
      }

      logger.info(`Event ${eventId}: "${event.question}"`);
      logger.info(`Deadline: ${new Date(event.deadline * 1000).toISOString()}, Resolved: ${event.resolved}`);

      // Check if ready for resolution
      if (isEventReadyForResolution(event)) {
        logger.info(`Event ${eventId} is ready for resolution`);

        const success = await resolveEvent(eventId);
        if (success) {
          resolvedCount++;
        }

        // Add delay between resolutions
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else if (event.resolved) {
        logger.info(`Event ${eventId} is already resolved`);
      } else {
        const timeRemaining = event.deadline - Math.floor(Date.now() / 1000);
        logger.info(`Event ${eventId} not ready yet (${Math.floor(timeRemaining / 3600)} hours remaining)`);
      }
    }

    logger.info(`Resolution process complete. Resolved ${resolvedCount} events.`);
    return resolvedCount;
  } catch (error: any) {
    logger.error('Error in resolution process:', {
      message: error.message,
      stack: error.stack,
    });
    return 0;
  }
}

/**
 * Monitor and resolve events continuously
 */
export async function startResolutionMonitor(intervalMs: number = 300000): Promise<void> {
  logger.info(`Starting resolution monitor (interval: ${intervalMs}ms)`);

  // Run immediately
  await processResolutions();

  // Then run on interval
  setInterval(async () => {
    try {
      await processResolutions();
    } catch (error: any) {
      logger.error('Error in resolution monitor:', error.message);
    }
  }, intervalMs);
}
