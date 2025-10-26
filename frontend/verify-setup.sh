#!/bin/bash

# Frontend Verification Script
# Checks if all frontend components and integrations are properly set up

echo "🔍 Fatecast Frontend Verification"
echo "=================================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in frontend directory"
    exit 1
fi

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v)
echo "   Node.js: $node_version"

# Check if dependencies are installed
echo ""
echo "📚 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules not found. Run 'npm install'"
else
    echo "   ✅ node_modules found"
fi

# Check for required packages
echo ""
echo "🔧 Checking required packages..."
packages=(
    "@blockscout/app-sdk"
    "@rainbow-me/rainbowkit"
    "wagmi"
    "viem"
    "ethers"
    "next"
    "react"
)

for package in "${packages[@]}"; do
    if grep -q "\"$package\"" package.json; then
        echo "   ✅ $package"
    else
        echo "   ❌ $package - MISSING"
    fi
done

# Check environment variables
echo ""
echo "🔐 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local found"
    
    # Check for required variables
    required_vars=(
        "NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS"
        "NEXT_PUBLIC_PYUSD_ADDRESS"
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "$var" .env.local; then
            value=$(grep "$var" .env.local | cut -d '=' -f 2)
            if [ -z "$value" ] || [ "$value" == "YOUR_PROJECT_ID_HERE" ]; then
                echo "   ⚠️  $var - needs to be set"
            else
                echo "   ✅ $var"
            fi
        else
            echo "   ❌ $var - MISSING"
        fi
    done
else
    echo "   ❌ .env.local not found"
fi

# Check component files
echo ""
echo "🎨 Checking component files..."
components=(
    "src/components/Header.tsx"
    "src/components/EventList.tsx"
    "src/components/EventCard.tsx"
    "src/components/BetModal.tsx"
    "src/components/UserPositions.tsx"
    "src/components/ActivityFeed.tsx"
    "src/components/ContractStats.tsx"
    "src/components/Providers.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "   ✅ $(basename $component)"
    else
        echo "   ❌ $(basename $component) - MISSING"
    fi
done

# Check hook files
echo ""
echo "🪝 Checking hook files..."
hooks=(
    "src/hooks/useContract.ts"
    "src/hooks/useEvents.ts"
    "src/hooks/useUserBets.ts"
    "src/hooks/usePYUSD.ts"
)

for hook in "${hooks[@]}"; do
    if [ -f "$hook" ]; then
        echo "   ✅ $(basename $hook)"
    else
        echo "   ❌ $(basename $hook) - MISSING"
    fi
done

# Check lib files
echo ""
echo "📖 Checking library files..."
libs=(
    "src/lib/blockscout.ts"
    "src/lib/utils.ts"
)

for lib in "${libs[@]}"; do
    if [ -f "$lib" ]; then
        echo "   ✅ $(basename $lib)"
    else
        echo "   ❌ $(basename $lib) - MISSING"
    fi
done

# Check config files
echo ""
echo "⚙️  Checking configuration files..."
configs=(
    "src/config/wagmi.ts"
    "src/config/contracts.ts"
)

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo "   ✅ $(basename $config)"
    else
        echo "   ❌ $(basename $config) - MISSING"
    fi
done

# Check for Blockscout SDK integration
echo ""
echo "🔗 Checking Blockscout SDK integration..."
if grep -q "NotificationProvider" src/components/Providers.tsx; then
    echo "   ✅ NotificationProvider configured"
else
    echo "   ❌ NotificationProvider - NOT FOUND"
fi

if grep -q "TransactionPopupProvider" src/components/Providers.tsx; then
    echo "   ✅ TransactionPopupProvider configured"
else
    echo "   ❌ TransactionPopupProvider - NOT FOUND"
fi

if grep -q "useNotification" src/hooks/useContract.ts; then
    echo "   ✅ useNotification hook integrated"
else
    echo "   ❌ useNotification - NOT FOUND"
fi

if grep -q "useTransactionPopup" src/components/Header.tsx; then
    echo "   ✅ useTransactionPopup hook integrated"
else
    echo "   ❌ useTransactionPopup - NOT FOUND"
fi

# Summary
echo ""
echo "=================================="
echo "📊 Verification Summary"
echo "=================================="
echo ""
echo "If all checks passed, you can run:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local"
echo "  2. Connect your wallet to Sepolia testnet"
echo "  3. Get testnet PYUSD for testing"
echo ""
