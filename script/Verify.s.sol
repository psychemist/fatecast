// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title VerifyScript
 * @notice Script to verify contracts on Blockscout
 * @dev This script provides instructions for manual verification
 * 
 * Automatic verification with forge:
 * forge verify-contract <CONTRACT_ADDRESS> \
 *   src/PredictionMarket.sol:PredictionMarket \
 *   --verifier blockscout \
 *   --verifier-url https://sepolia.blockscout.com/api \
 *   --constructor-args $(cast abi-encode "constructor(address,address,uint256,uint256)" <PYUSD> <PYTH> <MIN> <MAX>)
 */
contract VerifyScript is Script {
    function run() external view {
        console.log("=================================================");
        console.log("Contract Verification Guide");
        console.log("=================================================");
        console.log("");
        
        console.log("1. Get contract addresses from deployment file:");
        console.log("   cat deployments/deployment-11155111.json");
        console.log("");
        
        console.log("2. Verify PredictionMarket contract:");
        console.log("   forge verify-contract <MARKET_ADDRESS> \\");
        console.log("     src/PredictionMarket.sol:PredictionMarket \\");
        console.log("     --verifier blockscout \\");
        console.log("     --verifier-url https://sepolia.blockscout.com/api \\");
        console.log("     --constructor-args $(cast abi-encode \"constructor(address,address,uint256,uint256)\" <PYUSD_ADDRESS> <PYTH_ADDRESS> 1000000 10000000000)");
        console.log("");
        
        console.log("3. Verify MockPYUSD (if deployed):");
        console.log("   forge verify-contract <PYUSD_ADDRESS> \\");
        console.log("     src/mocks/MockPYUSD.sol:MockPYUSD \\");
        console.log("     --verifier blockscout \\");
        console.log("     --verifier-url https://sepolia.blockscout.com/api");
        console.log("");
        
        console.log("4. Verify MockPyth (if deployed):");
        console.log("   forge verify-contract <PYTH_ADDRESS> \\");
        console.log("     src/mocks/MockPyth.sol:MockPyth \\");
        console.log("     --verifier blockscout \\");
        console.log("     --verifier-url https://sepolia.blockscout.com/api");
        console.log("");
        
        console.log("Alternative: Use Etherscan-compatible verification:");
        console.log("   forge verify-contract <CONTRACT_ADDRESS> \\");
        console.log("     <CONTRACT_PATH> \\");
        console.log("     --chain sepolia \\");
        console.log("     --etherscan-api-key <YOUR_BLOCKSCOUT_API_KEY>");
        console.log("");
        
        console.log("=================================================");
        console.log("Manual Verification (via Blockscout UI):");
        console.log("=================================================");
        console.log("1. Go to: https://sepolia.blockscout.com");
        console.log("2. Search for your contract address");
        console.log("3. Click 'Contract' tab");
        console.log("4. Click 'Verify & Publish'");
        console.log("5. Select 'Solidity (Standard JSON Input)'");
        console.log("6. Upload the standard JSON from Foundry");
        console.log("7. Enter constructor arguments");
        console.log("8. Submit verification");
        console.log("=================================================");
    }
}
