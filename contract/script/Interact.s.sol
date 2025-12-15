// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";
import "../src/mocks/MockPYUSD.sol";
import "../src/mocks/MockPyth.sol";

/**
 * @title InteractScript
 * @notice Script for interacting with deployed PredictionMarket contract
 * @dev Run with: forge script script/Interact.s.sol:InteractScript --rpc-url $SEPOLIA_RPC_URL --broadcast
 */
contract InteractScript is Script {
    // Pyth price feed IDs (mainnet/testnet)
    bytes32 public constant BTC_USD_FEED_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 public constant ETH_USD_FEED_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant SOL_USD_FEED_ID = 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d;

    function run() external {
        // Load deployment addresses
        string memory deploymentFile = vm.readFile("deployments/deployment-11155111.json");
        
        // Parse addresses (you may need to adjust based on actual JSON structure)
        address marketAddress = vm.parseJsonAddress(deploymentFile, ".contracts.PredictionMarket");
        address pyusdAddress = vm.parseJsonAddress(deploymentFile, ".contracts.PYUSD");
        address pythAddress = vm.parseJsonAddress(deploymentFile, ".contracts.PythOracle");

        console.log("=================================================");
        console.log("Interacting with PredictionMarket");
        console.log("=================================================");
        console.log("PredictionMarket:", marketAddress);
        console.log("PYUSD:", pyusdAddress);
        console.log("Pyth Oracle:", pythAddress);
        console.log("");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        PredictionMarket market = PredictionMarket(marketAddress);
        MockPYUSD pyusd = MockPYUSD(pyusdAddress);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Create a test event
        console.log("Creating test event...");
        uint256 eventId = market.createEvent(
            "Will BTC reach $100k by end of 2025?",
            BTC_USD_FEED_ID,
            100000 * 1e8, // $100,000 with 8 decimals (Pyth format)
            block.timestamp + 30 days
        );
        console.log("Event created with ID:", eventId);
        console.log("");

        // 2. Mint PYUSD for testing (if mock)
        try pyusd.mint(deployer, 10000 * 1e6) {
            console.log("Minted 10,000 PYUSD for testing");
        } catch {
            console.log("Could not mint PYUSD (may be real token)");
        }
        console.log("");

        // 3. Check PYUSD balance
        uint256 balance = pyusd.balanceOf(deployer);
        console.log("Deployer PYUSD balance:", balance / 1e6, "PYUSD");
        console.log("");

        // 4. Approve and place a test bet
        if (balance >= 100 * 1e6) {
            console.log("Placing test bet of 100 PYUSD on YES...");
            pyusd.approve(marketAddress, 100 * 1e6);
            market.enterMarket(eventId, true, 100 * 1e6);
            console.log("Bet placed successfully!");
        } else {
            console.log("Insufficient PYUSD balance to place bet");
        }
        console.log("");

        vm.stopBroadcast();

        // 5. Query event details
        PredictionMarket.Event memory evt = market.getEvent(eventId);
        console.log("=================================================");
        console.log("Event Details:");
        console.log("=================================================");
        console.log("Question:", evt.question);
        console.log("Deadline:", evt.deadline);
        console.log("Total Yes:", evt.totalYes / 1e6, "PYUSD");
        console.log("Total No:", evt.totalNo / 1e6, "PYUSD");
        console.log("Total Pool:", evt.totalPool / 1e6, "PYUSD");
        console.log("Resolved:", evt.resolved);
        console.log("=================================================");
    }
}
