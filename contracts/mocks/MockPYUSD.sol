// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockPYUSD
 * @notice Mock PYUSD token for testing purposes
 * @dev This is a simple ERC20 token that allows anyone to mint tokens for testing
 */
contract MockPYUSD is ERC20 {
    uint8 private _decimals;

    constructor() ERC20("Mock PayPal USD", "mPYUSD") {
        _decimals = 6; // PYUSD uses 6 decimals like USDC
    }

    /**
     * @notice Returns the number of decimals used by the token
     * @return The number of decimals (6 for PYUSD)
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens to any address (for testing only)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Mint 1000 PYUSD to the caller for easy testing
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10**_decimals);
    }
}
