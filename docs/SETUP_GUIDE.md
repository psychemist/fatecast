# Fatecast - API Keys & Configuration Guide

## Required API Keys and Resources

### 1. Sepolia RPC URL
Get a free RPC endpoint from one of these providers:

#### Alchemy (Recommended)
1. Go to [https://www.alchemy.com/](https://www.alchemy.com/)
2. Sign up for a free account
3. Create a new app
4. Select "Ethereum" and "Sepolia" network
5. Copy your API key
6. Your RPC URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

#### Infura
1. Go to [https://infura.io/](https://infura.io/)
2. Sign up for a free account
3. Create a new project
4. Select Sepolia network
5. Copy your project ID
6. Your RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### 2. Wallet Private Key
**⚠️ SECURITY WARNING**: Never commit your private key or share it publicly!

To get your private key from MetaMask:
1. Open MetaMask
2. Click the three dots menu
3. Go to "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (starts with 0x)

**Note**: For production, use a dedicated deployment wallet with minimal funds.

### 3. Blockscout API Key
Blockscout for Sepolia doesn't require an API key for basic verification, but you can set it to empty string `""` in your `.env` file.

For other networks or enhanced features:
1. Visit the Blockscout instance for your network
2. Create an account
3. Generate an API key from your profile

### 4. Sepolia Testnet ETH
Get free Sepolia ETH from these faucets:

- **Alchemy Sepolia Faucet**: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
- **Infura Sepolia Faucet**: [https://www.infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)
- **QuickNode Faucet**: [https://faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

You'll need about 0.5-1 ETH for deployment and testing.

### 5. PYUSD on Sepolia

#### Option A: Deploy Mock PYUSD (Recommended for Testing)
The project includes a MockPYUSD contract you can deploy yourself.

#### Option B: Use Existing Testnet PYUSD
Check if PYUSD has an official testnet deployment. As of now, you may need to:
1. Deploy the mock contract
2. Mint tokens to your test accounts
3. Use for testing

The default address in `.env.example` is a placeholder and may not be active.

### 6. Pyth Oracle Configuration

#### Pyth Contract Address (Sepolia)
```
0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
```

This is the official Pyth contract on Sepolia testnet.

#### Pyth Price Feed IDs
Pyth uses unique feed IDs for different price pairs:

**BTC/USD**:
```
0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
```

**ETH/USD**:
```
0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
```

Find more feed IDs at: [https://pyth.network/developers/price-feed-ids](https://pyth.network/developers/price-feed-ids)

## Setting Up Your .env File

1. Copy the example file:
```bash
cp .env.example .env
```

2. Open `.env` in your editor

3. Fill in the values:
```env
# Get from Alchemy or Infura
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Export from MetaMask (use a test wallet!)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Optional for Blockscout
BLOCKSCOUT_API_KEY=

# Sepolia addresses (already filled)
PYUSD_CONTRACT_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
PYTH_CONTRACT_ADDRESS=0xDd24F84d36BF92C65F92307595335bdFab5Bbd21

# Pyth feed IDs (already filled)
PYTH_BTC_USD_FEED_ID=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
PYTH_ETH_USD_FEED_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace

# Gas reporting
REPORT_GAS=true

# For ASI agent (create a separate test wallet)
ASI_AGENT_PRIVATE_KEY=
```

## Verification Checklist

Before deploying, verify you have:
- [ ] Sepolia RPC URL configured
- [ ] Private key added (test wallet only!)
- [ ] At least 0.5 Sepolia ETH in deployment wallet
- [ ] `.env` file created and filled
- [ ] `.env` added to `.gitignore` ✅ (already done)
- [ ] Dependencies installed (`npm install`)
- [ ] Contracts compile successfully (`npm run compile`)

## Next Steps

Once your environment is configured:
1. Run tests: `npm test`
2. Deploy locally: `npm run deploy:local`
3. Deploy to Sepolia: `npm run deploy:sepolia`
4. Verify contract: `npm run verify:sepolia`

## Troubleshooting

### "Invalid API Key" Error
- Double-check your RPC URL is correct
- Ensure there are no extra spaces
- Try regenerating the API key

### "Insufficient Funds" Error
- Get more Sepolia ETH from faucets
- Check your wallet balance on [Sepolia Etherscan](https://sepolia.etherscan.io/)

### "Contract Verification Failed"
- Ensure Blockscout URL is correct
- Check constructor arguments match deployment
- Try manual verification on Blockscout website

### "Pyth Feed Not Found"
- Verify the feed ID is correct (64-character hex string)
- Check Pyth documentation for updated feed IDs
- Ensure you're using testnet feeds for testnet deployment

## Security Best Practices

1. **Never commit `.env` file** - Already in .gitignore ✅
2. **Use separate wallets** - Don't use your main wallet for testing
3. **Limit funds** - Only keep minimal ETH in deployment wallet
4. **Rotate keys** - After development, create new wallets for production
5. **Use hardware wallets** - For production deployments
6. **Enable 2FA** - On all service accounts (Alchemy, Infura, etc.)

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Pyth Network Docs](https://docs.pyth.network/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Sepolia Testnet Info](https://sepolia.dev/)
- [Blockscout Explorer](https://eth-sepolia.blockscout.com/)
