import axios from 'axios';
import logger from './logger';

const ASI_ONE_API_URL = 'https://api.asi1.ai/v1/chat/completions';
const ASI_ONE_API_KEY = process.env.AGENT_API_KEY || process.env.ASI_ONE_API_KEY || '';

export interface AsiOneMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AsiOneResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call ASI:One API for AI reasoning
 */
export async function callAsiOne(
  messages: AsiOneMessage[],
  model: string = 'asi1-mini'
): Promise<string> {
  try {
    if (!ASI_ONE_API_KEY) {
      throw new Error('ASI:One API key not configured');
    }

    const response = await axios.post<AsiOneResponse>(
      ASI_ONE_API_URL,
      {
        model,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ASI_ONE_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    logger.info(`ASI:One response (${response.data.usage.total_tokens} tokens): ${content.substring(0, 100)}...`);
    
    return content;
  } catch (error: any) {
    logger.error('Error calling ASI:One:', {
      message: error.message,
      response: error.response?.data,
    });
    throw error;
  }
}

/**
 * Generate prediction event ideas using ASI:One
 */
export async function generateEventIdeas(
  currentPrices: Record<string, number>,
  existingEvents: string[]
): Promise<string[]> {
  const prompt = `You are an AI helping create interesting cryptocurrency prediction markets.

Current prices:
${Object.entries(currentPrices).map(([asset, price]) => `- ${asset}: $${price}`).join('\n')}

Existing events (don't duplicate):
${existingEvents.join('\n')}

Generate 3 unique, interesting prediction questions about cryptocurrency prices for the next 24-72 hours. 
Format each as: "Will [ASSET] reach $[PRICE] by [DATE]?"

Focus on:
1. Realistic but interesting price targets (10-30% moves)
2. Different assets than existing events
3. Time horizons of 1-3 days

Return ONLY the 3 questions, one per line.`;

  const messages: AsiOneMessage[] = [
    { role: 'system', content: 'You are a crypto market analyst creating prediction market events.' },
    { role: 'user', content: prompt },
  ];

  const response = await callAsiOne(messages, 'asi1-mini');
  
  // Parse the response into individual questions
  const questions = response
    .split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0 && q.includes('Will'))
    .slice(0, 3);

  return questions;
}

/**
 * Verify event outcome using ASI:One reasoning
 */
export async function verifyEventOutcome(
  question: string,
  targetPrice: number,
  currentPrice: number,
  pythPrice: number
): Promise<{
  shouldResolve: boolean;
  outcome: boolean;
  reasoning: string;
}> {
  const prompt = `You are verifying a prediction market event outcome.

Event question: "${question}"
Target price: $${targetPrice}
Current Pyth oracle price: $${pythPrice}
Current market price: $${currentPrice}

Should this event be resolved now? If yes, did it meet the target (YES) or not (NO)?

Consider:
1. Is the Pyth price reliable? (within 5% of market price)
2. Has the target been clearly met or missed?
3. Is there any ambiguity that requires waiting?

Respond in JSON format:
{
  "shouldResolve": true/false,
  "outcome": true/false,
  "reasoning": "explanation"
}`;

  const messages: AsiOneMessage[] = [
    { role: 'system', content: 'You are a prediction market oracle verifier.' },
    { role: 'user', content: prompt },
  ];

  const response = await callAsiOne(messages, 'asi1-extended');
  
  try {
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
  } catch (e) {
    logger.warn('Could not parse ASI:One JSON response, using default');
  }

  // Fallback: simple logic
  return {
    shouldResolve: true,
    outcome: pythPrice >= targetPrice,
    reasoning: 'Fallback: using Pyth price comparison',
  };
}

/**
 * Analyze market trends for event creation timing
 */
export async function analyzeMarketTrends(
  asset: string,
  currentPrice: number,
  priceHistory?: number[]
): Promise<{
  createEvent: boolean;
  suggestedTarget: number;
  reasoning: string;
}> {
  const historyStr = priceHistory
    ? `Recent prices: ${priceHistory.join(', ')}`
    : 'No price history available';

  const prompt = `Analyze ${asset} market conditions:

Current price: $${currentPrice}
${historyStr}

Should we create a prediction event now? If yes, suggest a good target price for a 24-48 hour prediction.

Respond in JSON:
{
  "createEvent": true/false,
  "suggestedTarget": number,
  "reasoning": "explanation"
}`;

  const messages: AsiOneMessage[] = [
    { role: 'system', content: 'You are a crypto market trend analyst.' },
    { role: 'user', content: prompt },
  ];

  const response = await callAsiOne(messages, 'asi1-mini');
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
  } catch (e) {
    logger.warn('Could not parse market analysis response');
  }

  // Fallback
  return {
    createEvent: true,
    suggestedTarget: currentPrice * 1.15, // 15% increase
    reasoning: 'Fallback: using simple 15% target',
  };
}
