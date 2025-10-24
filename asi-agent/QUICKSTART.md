# ASI Agent Quick Start Guide

Get your Fatecast ASI Agent up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Sepolia testnet ETH (get from [faucet](https://sepoliafaucet.com/))
- [ ] Contracts deployed to Sepolia (see main DEPLOYMENT_GUIDE.md)
- [ ] Agent wallet address funded with ~0.1 ETH

## Quick Setup

### 1. Install Dependencies (1 minute)

```bash
cd asi-agent
npm install
```

### 2. Configure Environment (2 minutes)

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required - Get from deployment
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
AGENT_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
PREDICTION_MARKET_ADDRESS=0x...  # From deployments/deployment-11155111.json
PYUSD_ADDRESS=0x...              # From deployments/deployment-11155111.json

# Optional - Can use defaults
PYTH_ORACLE_ADDRESS=0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
EVENT_CREATION_INTERVAL=3600000   # 1 hour
EVENT_RESOLUTION_INTERVAL=300000  # 5 minutes
MAX_EVENTS_PER_DAY=10
LOG_LEVEL=info
```

### 3. Build & Test (2 minutes)

```bash
# Build TypeScript
npm run build

# Test the monitor (checks connection)
npm run monitor
```

Expected output:
```
Fatecast Agent Monitor
Agent Wallet Balance: 0.095 ETH
📊 Current Prices:
  BTC_USD: $67,234.50
  ETH_USD: $3,456.78
  SOL_USD: $145.23
📋 Active Events:
  No active events
```

## Usage

### Create Your First Event

```bash
npm run create-events
```

This will:
1. Fetch current crypto prices from Pyth
2. Select a random event template
3. Calculate target price
4. Submit transaction to create event
5. Log the new event ID

### Run Continuous Mode

```bash
npm start
```

Agent will:
- Create events every hour
- Resolve events every 5 minutes
- Log all activity to `logs/agent.log`

Press `Ctrl+C` to stop.

### Monitor Active Events

```bash
npm run monitor
```

Shows:
- Wallet balance
- Current prices
- All active events with deadlines

### Manually Resolve Events

```bash
npm run resolve-events
```

Checks all active events and resolves those past deadline.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm start` | Run agent continuously |
| `npm run dev` | Run in development mode (with ts-node) |
| `npm run create-events` | Create 1 event manually |
| `npm run create-events 3` | Create 3 events manually |
| `npm run resolve-events` | Resolve all pending events |
| `npm run monitor` | View status and active events |
| `npm run build` | Compile TypeScript |

## Verification

After creating an event, verify on Blockscout:

1. Go to your PredictionMarket contract on Blockscout
2. Click "Events" tab
3. Look for `EventCreated` event
4. Note the `eventId` parameter

Or query directly:

```bash
cast call $PREDICTION_MARKET_ADDRESS "getActiveEvents()" --rpc-url $SEPOLIA_RPC_URL
```

## Production Deployment (Optional)

Use PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start agent
pm2 start dist/index.js --name fatecast-agent

# Save configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup

# Monitor
pm2 logs fatecast-agent
pm2 status
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run build
```

### "Insufficient funds" error
- Check wallet balance: `npm run monitor`
- Get more Sepolia ETH from faucet

### "Connection refused" error
- Check RPC_URL in `.env`
- Try a different RPC provider (Alchemy, Infura)

### Events not appearing
- Check transaction hash on Blockscout
- Verify contract address is correct
- Check wallet has ETH for gas

### Agent stops unexpectedly
- Check logs: `tail -f logs/agent.log`
- Check for errors: `tail -f logs/error.log`
- Use PM2 for auto-restart

## Next Steps

1. ✅ Agent is running
2. Configure frontend with contract addresses
3. Test full flow: create event → place bets → resolve → claim
4. Deploy to production server with PM2
5. Set up monitoring and alerts

## Support

- 📖 Full documentation: `README.md`
- 🐛 Check logs: `logs/agent.log`
- 🔍 Monitor status: `npm run monitor`
- ❓ Issues: Open GitHub issue

---

**Ready to go!** 🚀 Your agent is set up and ready to automate Fatecast events.
