#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Fatecast System Check & Event Creator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Load environment variables
if [ -f frontend/.env.local ]; then
    export $(grep -v '^#' frontend/.env.local | xargs)
fi

CONTRACT_ADDRESS="${NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS:-0x86D29196D23d88B68359B819Cc4b93671B03953C}"
RPC_URL="${NEXT_PUBLIC_RPC_URL:-https://eth-sepolia.g.alchemy.com/v2/P9Wl_G12LXrEHdc9EZDE-b5kKRh6l-LZ}"

echo -e "${YELLOW}1. Checking Smart Contract State...${NC}"
echo -e "   Contract: ${CONTRACT_ADDRESS}"
echo ""

# Check event counter
echo -e "${BLUE}   Checking event counter...${NC}"
EVENT_COUNT=$(cast call $CONTRACT_ADDRESS "eventCounter()" --rpc-url $RPC_URL 2>&1)

if [ $? -eq 0 ]; then
    EVENT_COUNT_DEC=$((16#${EVENT_COUNT#0x}))
    echo -e "   ${GREEN}✓${NC} Total events created: ${GREEN}${EVENT_COUNT_DEC}${NC}"
else
    echo -e "   ${RED}✗${NC} Failed to read event counter"
    echo "   Error: $EVENT_COUNT"
    exit 1
fi

# Check active events
echo -e "${BLUE}   Checking active events...${NC}"
ACTIVE_EVENTS=$(cast call $CONTRACT_ADDRESS "getActiveEvents()" --rpc-url $RPC_URL 2>&1)

if [ $? -eq 0 ]; then
    # Count number of event IDs in the array
    ACTIVE_COUNT=$(echo "$ACTIVE_EVENTS" | grep -o "0x" | wc -l | xargs)
    echo -e "   ${GREEN}✓${NC} Active events: ${GREEN}${ACTIVE_COUNT}${NC}"
    
    if [ "$ACTIVE_COUNT" -gt 0 ]; then
        echo ""
        echo -e "${GREEN}   🎉 Events exist! Frontend should display them.${NC}"
        echo ""
        echo -e "${YELLOW}2. Next Steps:${NC}"
        echo -e "   • Open frontend: ${BLUE}cd frontend && npm run dev${NC}"
        echo -e "   • Check browser console for debug logs"
        echo -e "   • If events still don't show, check wagmi/RPC config"
    fi
else
    echo -e "   ${RED}✗${NC} Failed to read active events"
    echo "   Error: $ACTIVE_EVENTS"
fi

echo ""

# If no events, offer to create some
if [ "$EVENT_COUNT_DEC" -eq 0 ] || [ "$ACTIVE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}   ⚠️  No events found on contract${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}To create events, you need to:${NC}"
    echo ""
    echo -e "${YELLOW}Option 1: Use ASI Agent (Recommended)${NC}"
    echo -e "   cd asi-agent"
    echo -e "   npm install                    # If not done already"
    echo -e "   npm run create-events -- 3     # Create 3 events"
    echo ""
    echo -e "${YELLOW}Option 2: Run Continuous Agent${NC}"
    echo -e "   cd asi-agent"
    echo -e "   npm run dev                    # Runs continuously"
    echo ""
    echo -e "${YELLOW}Option 3: Manual Creation (Advanced)${NC}"
    echo -e "   Use cast or foundry scripts to call createEvent()"
    echo ""
    echo -e "${RED}Note:${NC} The agent wallet must be authorized as 'asiAgent' on the contract"
    echo -e "      or you must use the contract owner wallet."
    echo ""
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Fatecast Component Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Smart Contract (Sepolia):  ${GREEN}✓ Deployed${NC}"
echo -e "  Address: ${CONTRACT_ADDRESS}"
echo -e "  Events Created: ${EVENT_COUNT_DEC}"
echo -e "  Active Events: ${ACTIVE_COUNT}"
echo ""
echo -e "ASI Agent:"
if [ -d "asi-agent/node_modules" ]; then
    echo -e "  ${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "  ${YELLOW}⚠ Run 'cd asi-agent && npm install'${NC}"
fi

if [ -f "asi-agent/.env" ]; then
    echo -e "  ${GREEN}✓ Configuration exists${NC}"
else
    echo -e "  ${RED}✗ Missing .env file${NC}"
    echo -e "  ${YELLOW}  Copy asi-agent/.env.example to asi-agent/.env${NC}"
fi
echo ""
echo -e "Frontend:"
if [ -d "frontend/node_modules" ]; then
    echo -e "  ${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "  ${YELLOW}⚠ Run 'cd frontend && npm install'${NC}"
fi

if [ -f "frontend/.env.local" ]; then
    echo -e "  ${GREEN}✓ Configuration exists${NC}"
else
    echo -e "  ${RED}✗ Missing .env.local file${NC}"
fi
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
