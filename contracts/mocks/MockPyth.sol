// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPyth
 * @notice Mock Pyth Oracle for testing purposes
 * @dev Simplified version of Pyth oracle that allows setting prices manually
 */
contract MockPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    // Mapping from price feed ID to price data
    mapping(bytes32 => Price) private prices;

    // Event emitted when a price is updated
    event PriceUpdate(bytes32 indexed id, int64 price, uint64 conf, uint256 publishTime);

    /**
     * @notice Set the price for a given price feed ID
     * @param id Price feed identifier
     * @param price Price value
     * @param conf Confidence interval
     * @param expo Price exponent
     * @param publishTime Timestamp of price publication
     */
    function setPrice(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo,
        uint256 publishTime
    ) external {
        prices[id] = Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime
        });

        emit PriceUpdate(id, price, conf, publishTime);
    }

    /**
     * @notice Get the latest price for a given price feed ID
     * @param id Price feed identifier
     * @return price Price data structure
     */
    function getPrice(bytes32 id) external view returns (Price memory price) {
        price = prices[id];
        require(price.publishTime > 0, "MockPyth: Price not set");
        return price;
    }

    /**
     * @notice Get price with no older than check (simplified for testing)
     * @param id Price feed identifier
     * @return price Price data structure
     */
    function getPriceNoOlderThan(bytes32 id, uint256) external view returns (Price memory price) {
        price = prices[id];
        require(price.publishTime > 0, "MockPyth: Price not set");
        return price;
    }

    /**
     * @notice Update price feeds with provided data (no-op for mock)
     * @dev In real Pyth, this validates and updates prices with proofs
     */
    function updatePriceFeeds(bytes[] calldata) external payable {
        // No-op for mock - prices are set via setPrice()
    }

    /**
     * @notice Get update fee (returns 0 for mock)
     */
    function getUpdateFee(bytes[] calldata) external pure returns (uint256) {
        return 0;
    }
}
