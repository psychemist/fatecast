#!/bin/bash

# Fatecast Quick Test Script
# This script helps you test the entire system step by step

set -e  # Exit on error

echo "========================================"
echo "Fatecast Testing Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with required variables"
    exit 1
fi

# Function to wait for user
wait_for_user() {
    read -p "Press Enter to continue..."
}

# Function to run command and check result
run_test() {
    local description="$1"
    local command="$2"
    
    echo -e "${YELLOW}▶ $description${NC}"
    echo "Command: $command"
    echo ""
    
    if eval "$command"; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo ""
        return 1
    fi
}

# Menu
echo "Select test phase:"
echo "1) Test smart contracts (local)"
echo "2) Deploy to Sepolia"
echo "3) Test ASI agent setup"
echo "4) Create test event"
echo "5) Place test bet"
echo "6) Resolve events"
echo "7) Run full automated test"
echo "8) Exit"
echo ""
read -p "Enter choice [1-8]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Testing Smart Contracts...${NC}"
        echo ""
        run_test "Running test suite" "forge test -vv"
        run_test "Checking coverage" "forge coverage"
        run_test "Gas report" "forge test --gas-report"
        echo -e "${GREEN}✅ All contract tests complete!${NC}"
        ;;
        
    2)
        echo -e "${YELLOW}Deploying to Sepolia...${NC}"
        echo ""
        
        # Check balance first
        echo "Checking deployer balance..."
        echo "Confirming global variables" $DEPLOYER_ADDRESS $SEPOLIA_RPC_URL
        BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $SEPOLIA_RPC_URL 2>/dev/null || echo "0")
        echo "Balance: $BALANCE wei"
        echo ""
        
        if [ "$BALANCE" == "0" ]; then
            echo -e "${RED}⚠️  Deployer has no ETH!${NC}"
            echo "Please fund your wallet with Sepolia ETH"
            echo "Address: $DEPLOYER_ADDRESS"
            exit 1
        fi
        
        # Dry run
        echo "Running deployment simulation..."
        forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL
        echo ""
        
        read -p "Deploy for real? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
            run_test "Deploying contracts" "forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv"
            
            if [ -f deployments/deployment-11155111.json ]; then
                echo -e "${GREEN}✅ Deployment successful!${NC}"
                echo ""
                echo "Contract addresses saved to: deployments/deployment-11155111.json"
                cat deployments/deployment-11155111.json
            fi
        fi
        ;;
        
    3)
        echo -e "${YELLOW}Testing ASI Agent Setup...${NC}"
        echo ""
        
        cd asi-agent
        
        # Check if built
        if [ ! -d "dist" ]; then
            echo "Building agent..."
            npm run build
        fi
        
        # Check agent balance
        if [ -n "$AGENT_PRIVATE_KEY" ]; then
            AGENT_ADDR=$(cast wallet address --private-key $AGENT_PRIVATE_KEY)
            AGENT_BALANCE=$(cast balance $AGENT_ADDR --rpc-url $SEPOLIA_RPC_URL 2>/dev/null || echo "0")
            echo "Agent address: $AGENT_ADDR"
            echo "Agent balance: $(cast --to-unit $AGENT_BALANCE ether) ETH"
            echo ""
            
            if [ "$AGENT_BALANCE" == "0" ]; then
                echo -e "${YELLOW}⚠️  Agent wallet has no ETH!${NC}"
                echo "Send some Sepolia ETH to: $AGENT_ADDR"
                echo ""
            fi
        fi
        
        run_test "Testing agent connectivity" "npm run monitor"
        cd ..
        ;;
        
    4)
        echo -e "${YELLOW}Creating Test Event...${NC}"
        echo ""
        
        cd asi-agent
        run_test "Creating event via agent" "npm run create-events"
        cd ..
        
        echo ""
        echo "Check event on Blockscout:"
        if [ -f deployments/deployment-11155111.json ]; then
            MARKET=$(jq -r '.contracts.PredictionMarket' deployments/deployment-11155111.json)
            echo "https://sepolia.blockscout.com/address/$MARKET/logs"
        fi
        ;;
        
    5)
        echo -e "${YELLOW}Placing Test Bet...${NC}"
        echo ""
        
        if [ ! -f deployments/deployment-11155111.json ]; then
            echo -e "${RED}❌ No deployment found!${NC}"
            echo "Please deploy first (option 2)"
            exit 1
        fi
        
        MARKET=$(jq -r '.contracts.PredictionMarket' deployments/deployment-11155111.json)
        PYUSD=$(jq -r '.contracts.PYUSD' deployments/deployment-11155111.json)
        
        echo "Market: $MARKET"
        echo "PYUSD: $PYUSD"
        echo ""
        
        # Mint PYUSD
        # read -p "Mint 1000 test PYUSD? (y/n): " mint
        # if [ "$mint" == "y" ]; then
        #     run_test "Minting PYUSD" "cast send $PYUSD 'mint(address,uint256)' $DEPLOYER_ADDRESS 1000000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY"
        # fi
        
        # Check balance
        BALANCE=$(cast call $PYUSD "balanceOf(address)" $DEPLOYER_ADDRESS --rpc-url $SEPOLIA_RPC_URL)
        echo "PYUSD Balance: $BALANCE (raw)"
        echo ""
        
        # Approve
        read -p "Approve 1 PYUSD for betting? (y/n): " approve
        if [ "$approve" == "y" ]; then
            run_test "Approving PYUSD" "cast send $PYUSD 'approve(address,uint256)' $MARKET 1000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY"
        fi
        
        # Bet
        read -p "Enter event ID to bet on: " event_id
        read -p "Bet YES (true) or NO (false)? [true/false]: " prediction
        
        run_test "Placing bet" "cast send $MARKET 'enterMarket(uint256,bool,uint256)' $event_id $prediction 1000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY"
        
        # Verify bet
        run_test "Verifying bet" "cast call $MARKET 'getUserBet(address,uint256)' $DEPLOYER_ADDRESS $event_id --rpc-url $SEPOLIA_RPC_URL"
        ;;
        
    6)
        echo -e "${YELLOW}Resolving Events...${NC}"
        echo ""
        
        cd asi-agent
        run_test "Running resolution process" "npm run resolve-events"
        cd ..
        ;;
        
    7)
        echo -e "${YELLOW}Running Full Automated Test...${NC}"
        echo ""
        
        # 1. Test contracts
        echo "Step 1/5: Testing contracts..."
        forge test -vv || exit 1
        echo ""
        
        # 2. Check agent
        echo "Step 2/5: Checking agent..."
        cd asi-agent
        npm run build
        npm run monitor || exit 1
        cd ..
        echo ""
        
        # 3. Create event
        echo "Step 3/5: Creating test event..."
        cd asi-agent
        npm run create-events || exit 1
        cd ..
        echo ""
        
        # 4. Monitor
        echo "Step 4/5: Checking status..."
        cd asi-agent
        npm run monitor || exit 1
        cd ..
        echo ""
        
        # 5. Try resolution
        echo "Step 5/5: Checking for resolutions..."
        cd asi-agent
        npm run resolve-events || exit 1
        cd ..
        echo ""
        
        echo -e "${GREEN}✅ Full automated test complete!${NC}"
        ;;
        
    8)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "Test complete!"
echo "========================================"
