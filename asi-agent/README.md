# Fatecast ASI Agent

Automated agent for creating and resolving prediction market events on Fatecast using Pyth oracle data.

## Overview

The ASI Agent automates two key operations:

1. **Event Creation**: Automatically creates prediction market events based on crypto price movements
2. **Event Resolution**: Monitors active events and resolves them when deadlines pass using Pyth oracle data

## Features

- 🤖 **Fully Automated**: Runs continuously without manual intervention
- 📊 **Pyth Integration**: Uses real-time Pyth price feeds for accurate oracle data
- ⚡ **Smart Scheduling**: Configurable intervals for event creation and resolution
- 🔒 **Rate Limiting**: Daily limits to prevent spam
- 📝 **Comprehensive Logging**: Detailed logs for monitoring and debugging
- 🎯 **Multiple Assets**: Supports BTC, ETH, SOL, and more

## Installation

### Prerequisites

- Node.js 18+ and npm
- A funded wallet (private key) for the agent
- Access to Sepolia testnet RPC

### Setup

1. **Install dependencies**:
   ```bash
   cd asi-agent
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required environment variables**:
   ```env
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   AGENT_PRIVATE_KEY=0x...
   PREDICTION_MARKET_ADDRESS=0x...  # From deployment
   PYUSD_ADDRESS=0x...              # From deployment
   ```

4. **Build TypeScript**:
   ```bash
   npm run build
   ```

## Usage

### Run Full Agent (Continuous)

Start the agent to run continuously with automated event creation and resolution:

```bash
npm start
# or for development
npm run dev
```

The agent will:
- Create new events every hour (configurable)
- Check for events to resolve every 5 minutes (configurable)
- Log all activities to console and `logs/agent.log`

### Manual Commands

#### Create Events Manually

Create a single event:
```bash
npm run create-events
```

Create multiple events:
```bash
npm run create-events 3  # Creates 3 events
```

#### Resolve Events Manually

Check and resolve all pending events:
```bash
npm run resolve-events
```

#### Monitor Status

View current status, prices, and active events:
```bash
npm run monitor
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | Ethereum RPC endpoint | Required |
| `AGENT_PRIVATE_KEY` | Agent wallet private key | Required |
| `PREDICTION_MARKET_ADDRESS` | PredictionMarket contract | Required |
| `PYUSD_ADDRESS` | PYUSD token contract | Required |
| `EVENT_CREATION_INTERVAL` | Time between event creation (ms) | 3600000 (1h) |
| `EVENT_RESOLUTION_INTERVAL` | Time between resolution checks (ms) | 300000 (5m) |
| `MAX_EVENTS_PER_DAY` | Maximum events created per day | 10 |
| `MIN_EVENT_DURATION` | Minimum event duration (seconds) | 86400 (1d) |
| `MAX_EVENT_DURATION` | Maximum event duration (seconds) | 2592000 (30d) |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |

### Event Templates

The agent uses predefined templates in `src/eventCreator.ts`:

```typescript
{
  question: 'Will BTC reach $[TARGET] by [DATE]?',
  feedKey: 'BTC_USD',
  percentageChange: 10,    // Target is 10% above current price
  durationDays: 7,         // Event lasts 7 days
}
```

Add custom templates by editing the `EVENT_TEMPLATES` array.

## Architecture

```
asi-agent/
├── src/
│   ├── index.ts           # Main entry point (continuous mode)
│   ├── config.ts          # Configuration management
│   ├── eventCreator.ts    # Event creation logic
│   ├── eventResolver.ts   # Event resolution logic
│   ├── createEvents.ts    # CLI: Manual event creation
│   ├── resolveEvents.ts   # CLI: Manual resolution
│   ├── monitor.ts         # CLI: Status monitoring
│   └── utils/
│       ├── logger.ts      # Winston logger setup
│       ├── contracts.ts   # Ethers contract instances
│       └── pyth.ts        # Pyth price feed integration
├── logs/                  # Log files
├── package.json
├── tsconfig.json
└── .env
```

## How It Works

### Event Creation Flow

1. **Fetch Prices**: Get current prices from Pyth for BTC, ETH, SOL
2. **Select Template**: Randomly choose an event template
3. **Calculate Target**: Compute target price based on percentage change
4. **Set Deadline**: Calculate deadline based on duration
5. **Create Event**: Submit transaction to PredictionMarket contract
6. **Log Event**: Record event ID and details

### Event Resolution Flow

1. **Fetch Active Events**: Get all unresolved events from contract
2. **Check Deadlines**: Identify events past their deadline
3. **Fetch Oracle Price**: Get current price from Pyth oracle
4. **Submit Resolution**: Call `resolveEvent()` on contract
5. **Log Outcome**: Record whether YES or NO won

## Monitoring

### Log Files

- `logs/agent.log` - All log messages
- `logs/error.log` - Error messages only

### Log Format

```json
{
  "timestamp": "2025-10-24 10:30:00",
  "level": "info",
  "message": "Event created successfully",
  "eventId": "1",
  "question": "Will BTC reach $100,000 by Nov 1, 2025?",
  "txHash": "0x..."
}
```

### Health Checks

Monitor agent health:
```bash
# Check if agent is running
ps aux | grep "node.*index.js"

# View recent logs
tail -f logs/agent.log

# Check wallet balance
npm run monitor
```

## Troubleshooting

### Common Issues

**Agent won't start**:
- Check `.env` configuration
- Verify wallet has ETH for gas
- Ensure RPC URL is accessible

**Events not creating**:
- Check daily limit not exceeded
- Verify wallet has sufficient ETH
- Check Pyth API is accessible

**Events not resolving**:
- Ensure events have passed deadline
- Check Pyth oracle is returning prices
- Verify gas price settings

**"Cannot find module" errors**:
```bash
npm install
npm run build
```

## Security

### Private Key Management

- ⚠️ **Never commit `.env` to version control**
- Use a dedicated wallet for the agent (not your main wallet)
- Fund only with necessary amount for gas
- Rotate keys periodically

### Best Practices

- Monitor logs regularly for errors
- Set up alerts for low balance
- Use separate wallets for testnet and mainnet
- Test thoroughly on testnet before mainnet deployment

## Testing

### Local Testing

1. **Deploy contracts locally**:
   ```bash
   # In main project directory
   anvil
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
   ```

2. **Configure agent for local**:
   ```env
   RPC_URL=http://localhost:8545
   PREDICTION_MARKET_ADDRESS=0x...  # From local deployment
   ```

3. **Run agent**:
   ```bash
   npm run dev
   ```

### Sepolia Testing

1. Get Sepolia ETH from faucet
2. Deploy contracts to Sepolia
3. Update `.env` with Sepolia addresses
4. Run: `npm run monitor` to check status
5. Run: `npm run create-events` to create test event
6. Wait for deadline and run: `npm run resolve-events`

## Production Deployment

### Server Setup

1. **Install PM2** (process manager):
   ```bash
   npm install -g pm2
   ```

2. **Start agent with PM2**:
   ```bash
   pm2 start dist/index.js --name fatecast-agent
   pm2 save
   pm2 startup
   ```

3. **Monitor with PM2**:
   ```bash
   pm2 status
   pm2 logs fatecast-agent
   pm2 restart fatecast-agent
   ```

### Monitoring Setup

Set up alerts for:
- Low wallet balance (<0.01 ETH)
- Failed transactions
- Agent process stopped
- No events created in 24h

Use services like:
- PM2 monitoring
- Slack/Discord webhooks
- Uptime monitoring (UptimeRobot)

## Maintenance

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Verify event creation/resolution
- **Monthly**: Review and optimize templates
- **Quarterly**: Update dependencies

### Updates

```bash
# Update dependencies
npm update

# Rebuild
npm run build

# Restart agent
pm2 restart fatecast-agent
```

## API Reference

### EventCreator

- `createPredictionEvent()`: Create a single event
- `createBatchEvents(count)`: Create multiple events

### EventResolver

- `getActiveEvents()`: Get all active event IDs
- `getEventDetails(eventId)`: Get event information
- `resolveEvent(eventId)`: Resolve a specific event
- `processResolutions()`: Resolve all pending events

### Pyth Service

- `fetchPythPrice(feedId)`: Get price from Pyth API
- `getPriceWithRetry(feedId)`: Get price with retry logic
- `getAllPrices()`: Get all configured prices

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check logs in `logs/agent.log`
- Review [Troubleshooting](#troubleshooting) section
