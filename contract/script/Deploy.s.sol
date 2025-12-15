// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";
import "../src/mocks/MockPYUSD.sol";
import "../src/mocks/MockPyth.sol";

/**
 * @title DeployScript
 * @notice Deployment script for PredictionMarket contract
 * @dev Run with: forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 */
contract DeployScript is Script {
    // Configuration - Sepolia Testnet Addresses
    address public constant SEPOLIA_PYTH_ORACLE = 0x4305FB66699C3B2702D4d05CF36551390A4c69C6; // Pyth Sepolia
    address public constant SEPOLIA_PYUSD = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9; // Real PYUSD on Sepolia
    
    // Default configuration
    uint256 public constant MIN_BET_AMOUNT = 1 * 1e6; // 1 PYUSD (6 decimals)
    uint256 public constant MAX_BET_AMOUNT = 10000 * 1e6; // 10,000 PYUSD (6 decimals)

    function run() external {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=================================================");
        console.log("Deploying PredictionMarket");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("Network:", block.chainid);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Use PYUSD based on network
        address pyusdAddress;
        if (block.chainid == 11155111) { // Sepolia
            pyusdAddress = SEPOLIA_PYUSD;
            console.log("Using real PYUSD (Sepolia) at:", pyusdAddress);
        } else if (block.chainid == 1) { // Mainnet
            pyusdAddress = vm.envAddress("PYUSD_CONTRACT_ADDRESS_MAINNET");
            console.log("Using real PYUSD (Mainnet) at:", pyusdAddress);
        } else {
            // For local testing, deploy mock
            console.log("Deploying MockPYUSD for local testing...");
            MockPYUSD pyusd = new MockPYUSD();
            pyusdAddress = address(pyusd);
            console.log("MockPYUSD deployed at:", pyusdAddress);
            
            // Mint some tokens to deployer for testing
            pyusd.mint(deployer, 1000000 * 1e6); // 1M PYUSD
            console.log("Minted 1,000,000 PYUSD to deployer");
        }
        console.log("");

        // Deploy or use existing Pyth Oracle
        address pythAddress;
        if (block.chainid == 11155111) { // Sepolia
            pythAddress = SEPOLIA_PYTH_ORACLE;
            console.log("Using Pyth Oracle at:", pythAddress);
        } else {
            console.log("Deploying MockPyth for testing...");
            MockPyth pyth = new MockPyth();
            pythAddress = address(pyth);
            console.log("MockPyth deployed at:", pythAddress);
        }
        console.log("");

        // Deploy PredictionMarket
        console.log("Deploying PredictionMarket...");
        PredictionMarket market = new PredictionMarket(
            pyusdAddress,
            pythAddress,
            deployer
        );
        console.log("PredictionMarket deployed at:", address(market));
        console.log("");

        // Configure initial settings
        console.log("Configuring PredictionMarket...");
        
        // Set ASI agent address if provided
        address asiAgent = vm.envOr("ASI_AGENT_ADDRESS", address(0));
        if (asiAgent != address(0)) {
            market.setASIAgent(asiAgent);
            console.log("ASI Agent set to:", asiAgent);
        } else {
            console.log("No ASI Agent configured (set ASI_AGENT_ADDRESS in .env)");
        }

        vm.stopBroadcast();

        // Log deployment info
        console.log("");
        console.log("=================================================");
        console.log("Deployment Complete!");
        console.log("=================================================");
        console.log("PredictionMarket:", address(market));
        console.log("PYUSD Token:", pyusdAddress);
        console.log("Pyth Oracle:", pythAddress);
        console.log("Min Bet Amount:", MIN_BET_AMOUNT);
        console.log("Max Bet Amount:", MAX_BET_AMOUNT);
        console.log("Owner:", market.owner());
        console.log("ASI Agent:", asiAgent);
        console.log("");
        console.log("Next Steps:");
        console.log("1. Verify contracts on Blockscout");
        console.log("2. Update frontend with contract addresses");
        console.log("3. Configure ASI agent (if not set)");
        console.log("4. Create initial events for testing");
        console.log("=================================================");

        // Save deployment addresses to file
        _saveDeployment(address(market), pyusdAddress, pythAddress);
    }

    function _saveDeployment(address market, address pyusd, address pyth) internal {
        string memory json = string.concat(
            '{\n',
            '  "network": "', vm.toString(block.chainid), '",\n',
            '  "timestamp": "', vm.toString(block.timestamp), '",\n',
            '  "contracts": {\n',
            '    "PredictionMarket": "', vm.toString(market), '",\n',
            '    "PYUSD": "', vm.toString(pyusd), '",\n',
            '    "PythOracle": "', vm.toString(pyth), '"\n',
            '  }\n',
            '}'
        );

        string memory filename = string.concat("deployment-", vm.toString(block.chainid), ".json");
        vm.writeFile(string.concat("deployments/", filename), json);
        console.log("Deployment info saved to:", filename);
    }
}
