# Fatecast 🔮

A decentralized social prediction market built on Ethereum that allows users to bet on future events using PYUSD, with automated event creation and resolution powered by ASI agents and Pyth Oracle.

## 🌟 Features

- **Prediction Markets**: Create and bet on YES/NO prediction events
- **PYUSD Integration**: Use PYUSD (PayPal USD) for all bets and payouts
- **Pyth Oracle**: Automated event resolution using real-world price data
- **ASI Agent**: AI-powered automated event creation and resolution
- **Farcaster Integration**: Social features and frame support
- **Blockscout Verification**: Fully verified smart contracts

## 🏗️ Architecture

### Smart Contracts
- **PredictionMarket.sol**: Main contract handling event creation, betting, resolution, and claims
- **Integrations**: OpenZeppelin, Pyth Oracle, PYUSD (ERC20)

### Backend
- **ASI Agent**: Automated event lifecycle management
  - Monitors crypto markets and trending events
  - Creates prediction events with appropriate Pyth price feeds
  - Automatically resolves events when deadlines pass

### Frontend
- **Next.js Application**: Modern web interface
- **Farcaster Frame**: Social prediction sharing
- **Web3 Integration**: WalletConnect/MetaMask support

## 📋 Prerequisites

- Node.js >= 16.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH
- Sepolia testnet PYUSD

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd fatecast

# Install dependencies
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `SEPOLIA_RPC_URL`: Your Ethereum RPC endpoint (Alchemy, Infura, etc.)
- `PRIVATE_KEY`: Your wallet private key for deployment
- `BLOCKSCOUT_API_KEY`: API key for contract verification
- `PYUSD_CONTRACT_ADDRESS`: PYUSD contract address on Sepolia
- `PYTH_CONTRACT_ADDRESS`: Pyth Oracle contract address on Sepolia

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

### 5. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy/deployPredictionMarket.js --network sepolia
```

### 6. Verify Contract

```bash
npx hardhat run scripts/verify/verifyContract.js --network sepolia
```

## 📖 Contract Functions

### Owner/Agent Functions

#### `createEvent(string question, address pythFeed, uint256 deadline)`
Create a new prediction event (only owner or ASI agent).

**Parameters:**
- `question`: The prediction question (e.g., "Will BTC be above $50k on Dec 31?")
- `pythFeed`: Pyth price feed ID for resolution
- `deadline`: Unix timestamp when the event expires

### User Functions

#### `enterMarket(uint256 eventId, bool prediction, uint256 amount)`
Place a bet on an event.

**Parameters:**
- `eventId`: ID of the event to bet on
- `prediction`: `true` for YES, `false` for NO
- `amount`: Amount of PYUSD to bet (must approve first)

#### `resolveEvent(uint256 eventId)`
Resolve an event using Pyth oracle data (callable by anyone after deadline).

**Parameters:**
- `eventId`: ID of the event to resolve

#### `claimWinnings(uint256 eventId)`
Claim winnings from a resolved event (winners only).

**Parameters:**
- `eventId`: ID of the resolved event

### View Functions

- `getEvent(uint256 eventId)`: Get event details
- `getUserBet(address user, uint256 eventId)`: Get user's bet on an event
- `getActiveEvents()`: Get list of active event IDs
- `calculatePotentialWinnings(uint256 eventId, address user)`: Calculate potential winnings

## 📡 Events

The contract emits the following events for frontend integration:

```solidity
event EventCreated(uint256 indexed eventId, string question, uint256 deadline);
event EnteredMarket(uint256 indexed eventId, address indexed user, bool prediction, uint256 amount);
event EventResolved(uint256 indexed eventId, bool outcome, int64 price);
event WinningsClaimed(uint256 indexed eventId, address indexed user, uint256 amount);
```

## 🤖 ASI Agent

The ASI Agent is a Node.js script that automatically:
1. Creates prediction events based on market trends
2. Monitors event deadlines
3. Resolves events using Pyth oracle data
4. Handles errors and retries

### Running the Agent

```bash
cd scripts/asi-agent
node agent.js
```

## 🌐 Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🧪 Testing

### Run all tests
```bash
npx hardhat test
```

### Run with gas reporting
```bash
REPORT_GAS=true npx hardhat test
```

### Generate coverage report
```bash
npx hardhat coverage
```

## 🔒 Security

- All contracts use OpenZeppelin's battle-tested implementations
- ReentrancyGuard on all state-changing functions
- Comprehensive input validation
- Emergency pause mechanism
- Timelocked admin functions

## 📚 Resources

- [Pyth Oracle Documentation](https://docs.pyth.network/)
- [PYUSD Documentation](https://paxos.com/pyusd/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Farcaster Frame Documentation](https://docs.farcaster.xyz/developers/frames)

## 🛠️ Project Structure

```
fatecast/
├── contracts/
│   ├── interfaces/          # Contract interfaces
│   ├── mocks/              # Mock contracts for testing
│   └── PredictionMarket.sol # Main contract
├── scripts/
│   ├── deploy/             # Deployment scripts
│   ├── verify/             # Verification scripts
│   └── asi-agent/          # ASI agent automation
├── test/                   # Contract tests
├── frontend/               # Next.js frontend
├── docs/                   # Additional documentation
└── hardhat.config.js       # Hardhat configuration
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Phase 1: Smart Contract Development ✅
- [ ] Phase 2: Testing & Security Audit
- [ ] Phase 3: ASI Agent Development
- [ ] Phase 4: Frontend Development
- [ ] Phase 5: Farcaster Integration
- [ ] Phase 6: Mainnet Deployment

---

Built with ❤️ for the decentralized prediction market ecosystem
