# Deployment Guide

This guide walks you through deploying the Fatecast PredictionMarket contracts to Sepolia testnet.

## Prerequisites

1. **Foundry installed**: Install from [getfoundry.sh](https://getfoundry.sh/)
2. **Sepolia ETH**: Get from [Sepolia faucet](https://sepoliafaucet.com/)
3. **Private key**: Deployer wallet with Sepolia ETH
4. **RPC URL**: Sepolia RPC endpoint (Alchemy, Infura, or public)

## Environment Setup

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure `.env` file**:
   ```bash
   # Required
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   
   # Optional
   ASI_AGENT_ADDRESS=0x... # If you have ASI agent set up
   BLOCKSCOUT_API_KEY=your_api_key # For automatic verification
   ```

3. **Create deployments directory**:
   ```bash
   mkdir -p deployments
   ```

## Phase 4.1: Build Contracts

Compile all contracts to ensure no errors:

```bash
forge build
```

Expected output:
```
[⠊] Compiling...
[⠒] Compiling 36 files with Solc 0.8.20
[⠢] Solc 0.8.20 finished in X.XXs
Compiler run successful!
```

## Phase 4.2: Deploy to Sepolia

### Step 1: Dry Run (Simulation)

Test deployment without broadcasting:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --sender $(cast wallet address --private-key $PRIVATE_KEY)
```

This simulates the deployment and shows gas estimates without spending ETH.

### Step 2: Deploy Contracts

Deploy to Sepolia testnet:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**Flags explained**:
- `--broadcast`: Actually send transactions to the network
- `--verify`: Attempt automatic verification on Blockscout
- `-vvvv`: Verbose output for debugging

### Step 3: Verify Deployment

Check that contracts were deployed:

```bash
# View deployment info
cat deployments/deployment-11155111.json

# Check contract code on Sepolia
cast code <CONTRACT_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
```

### Step 4: Save Contract Addresses

The deployment script automatically saves addresses to `deployments/deployment-11155111.json`:

```json
{
  "network": "11155111",
  "timestamp": "1729710000",
  "contracts": {
    "PredictionMarket": "0x...",
    "PYUSD": "0x...",
    "PythOracle": "0x..."
  }
}
```

## Phase 4.3: Blockscout Verification

### Option A: Automatic Verification (Preferred)

If `--verify` flag was used during deployment, verification should be automatic.

Check verification status:
```bash
# Visit Blockscout
open "https://sepolia.blockscout.com/address/<CONTRACT_ADDRESS>"
```

### Option B: Manual Verification

If automatic verification failed:

```bash
# Get contract address from deployment file
MARKET_ADDRESS=$(jq -r '.contracts.PredictionMarket' deployments/deployment-11155111.json)
PYUSD_ADDRESS=$(jq -r '.contracts.PYUSD' deployments/deployment-11155111.json)
PYTH_ADDRESS=$(jq -r '.contracts.PythOracle' deployments/deployment-11155111.json)

# Verify PredictionMarket
forge verify-contract $MARKET_ADDRESS \
  src/PredictionMarket.sol:PredictionMarket \
  --verifier blockscout \
  --verifier-url https://sepolia.blockscout.com/api \
  --constructor-args $(cast abi-encode "constructor(address,address,uint256,uint256)" $PYUSD_ADDRESS $PYTH_ADDRESS 1000000 10000000000)
```

### Option C: Via Blockscout UI

1. Go to [Sepolia Blockscout](https://sepolia.blockscout.com)
2. Search for your contract address
3. Click **"Code"** tab → **"Verify & Publish"**
4. Select **"Solidity (Standard JSON Input)"**
5. Upload `out/PredictionMarket.sol/PredictionMarket.json`
6. Enter constructor arguments:
   - PYUSD address
   - Pyth Oracle address
   - Min bet: `1000000` (1 PYUSD)
   - Max bet: `10000000000` (10,000 PYUSD)
7. Submit verification

## Phase 4.4: Post-Deployment Setup

### Step 1: Configure ASI Agent

If not set during deployment:

```bash
# Create a script to set ASI agent
forge script script/Interact.s.sol:InteractScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --sig "setAgent(address)" <ASI_AGENT_ADDRESS>
```

### Step 2: Create Test Event

Create your first prediction event:

```bash
forge script script/Interact.s.sol:InteractScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast
```

This script:
- Creates a test event: "Will BTC reach $100k by end of 2025?"
- Mints test PYUSD (if using mock)
- Places a test bet of 100 PYUSD on YES

### Step 3: Verify Contract Interactions

Test basic functionality:

```bash
# Get event details
cast call <MARKET_ADDRESS> "getEvent(uint256)" 1 \
  --rpc-url $SEPOLIA_RPC_URL

# Get user bet
cast call <MARKET_ADDRESS> "getUserBet(address,uint256)" <YOUR_ADDRESS> 1 \
  --rpc-url $SEPOLIA_RPC_URL

# Get active events
cast call <MARKET_ADDRESS> "getActiveEvents()" \
  --rpc-url $SEPOLIA_RPC_URL
```

### Step 4: Mint Test PYUSD

If using MockPYUSD, users can mint tokens:

```bash
# Mint 1000 PYUSD to your address
cast send <PYUSD_ADDRESS> "mint(address,uint256)" <YOUR_ADDRESS> 1000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 5: Test Full Flow

1. **Approve PYUSD**:
   ```bash
   cast send <PYUSD_ADDRESS> "approve(address,uint256)" <MARKET_ADDRESS> 100000000 \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

2. **Place Bet**:
   ```bash
   cast send <MARKET_ADDRESS> "enterMarket(uint256,bool,uint256)" 1 true 100000000 \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

3. **Check Bet**:
   ```bash
   cast call <MARKET_ADDRESS> "getUserBet(address,uint256)" <YOUR_ADDRESS> 1 \
     --rpc-url $SEPOLIA_RPC_URL
   ```

## Deployment Checklist

- [ ] Environment variables configured in `.env`
- [ ] Contracts compiled successfully (`forge build`)
- [ ] Dry run completed without errors
- [ ] Deployment broadcast to Sepolia
- [ ] Contract addresses saved to `deployments/` directory
- [ ] PredictionMarket verified on Blockscout
- [ ] MockPYUSD verified on Blockscout (if deployed)
- [ ] MockPyth verified on Blockscout (if deployed)
- [ ] ASI agent address configured
- [ ] Test event created successfully
- [ ] Test bet placed successfully
- [ ] Contract addresses added to frontend config
- [ ] ABIs exported for frontend integration

## Contract Addresses

After deployment, update your frontend configuration:

```typescript
// frontend/config/contracts.ts
export const CONTRACTS = {
  PREDICTION_MARKET: "0x..." as const,
  PYUSD: "0x..." as const,
  PYTH_ORACLE: "0x..." as const,
};

export const CHAIN_ID = 11155111; // Sepolia
```

## Troubleshooting

### Insufficient Balance

If you see "insufficient funds for gas * price + value":
- Get more Sepolia ETH from faucet
- Check balance: `cast balance <YOUR_ADDRESS> --rpc-url $SEPOLIA_RPC_URL`

### Verification Failed

If automatic verification fails:
- Try manual verification using `forge verify-contract`
- Use Blockscout UI for verification
- Check constructor arguments match deployment

### Transaction Reverted

If deployment reverts:
- Check constructor arguments are correct
- Ensure PYUSD and Pyth addresses are valid
- Verify min/max bet amounts are sensible

### RPC Rate Limiting

If you hit rate limits:
- Use a private RPC endpoint (Alchemy/Infura)
- Add delays between transactions
- Use `--slow` flag: `--slow --legacy`

## Next Steps

After successful deployment:

1. **Update Documentation**: Add contract addresses to README
2. **Configure Frontend**: Update contract addresses in frontend config
3. **Setup ASI Agent**: Configure agent to create/resolve events
4. **Announce Deployment**: Share contract addresses with team
5. **Monitor Events**: Watch for event creation and betting activity

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Sepolia Blockscout](https://sepolia.blockscout.com)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Pyth Documentation](https://docs.pyth.network/)
- [Forge Script Guide](https://book.getfoundry.sh/tutorials/solidity-scripting)

---

**Need Help?** Check the [troubleshooting guide](./TROUBLESHOOTING.md) or reach out to the team.
