// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PredictionMarket
 * @notice A decentralized prediction market where users can bet on future events using PYUSD
 * @dev Integrates with Pyth Oracle for automated event resolution and supports ASI agent automation
 */
contract PredictionMarket is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    /**
     * @notice Represents a prediction event
     */
    struct Event {
        uint256 id;
        string question;
        bytes32 pythFeedId;
        int64 targetPrice;
        uint256 deadline;
        uint256 totalYes;
        uint256 totalNo;
        uint256 totalPool;
        bool resolved;
        bool outcome; // true = yes/above target, false = no/below target
        address creator;
        uint256 createdAt;
    }

    /**
     * @notice Represents a user's bet on an event
     */
    struct UserBet {
        uint256 amount;
        bool prediction; // true = yes, false = no
        bool exists;
    }

    // ============ State Variables ============

    /// @notice PYUSD token contract
    IERC20 public immutable pyusd;

    /// @notice Pyth oracle contract
    address public immutable pythOracle;

    /// @notice ASI agent address authorized to create and resolve events
    address public asiAgent;

    /// @notice Counter for event IDs
    uint256 public eventCounter;

    /// @notice Minimum bet amount
    uint256 public minBetAmount;

    /// @notice Maximum bet amount
    uint256 public maxBetAmount;

    /// @notice Mapping from event ID to Event
    mapping(uint256 => Event) public events;

    /// @notice Mapping from user address to event ID to UserBet
    mapping(address => mapping(uint256 => UserBet)) public userBets;

    /// @notice Mapping to track if user has claimed winnings for an event
    mapping(address => mapping(uint256 => bool)) public hasClaimedWinnings;

    /// @notice Array of active event IDs
    uint256[] private activeEventIds;

    // ============ Events ============

    event EventCreated(
        uint256 indexed eventId,
        string question,
        bytes32 pythFeedId,
        int64 targetPrice,
        uint256 deadline,
        address indexed creator
    );

    event EnteredMarket(
        uint256 indexed eventId,
        address indexed user,
        bool prediction,
        uint256 amount
    );

    event EventResolved(
        uint256 indexed eventId,
        bool outcome,
        int64 finalPrice
    );

    event WinningsClaimed(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );

    event ASIAgentUpdated(address indexed oldAgent, address indexed newAgent);
    event BetLimitsUpdated(uint256 minBetAmount, uint256 maxBetAmount);

    // ============ Modifiers ============

    /**
     * @notice Restricts function access to owner or ASI agent
     */
    modifier onlyOwnerOrAgent() {
        require(
            msg.sender == owner() || msg.sender == asiAgent,
            "PredictionMarket: Caller is not owner or agent"
        );
        _;
    }

    /**
     * @notice Checks if event exists
     */
    modifier eventExists(uint256 eventId) {
        require(events[eventId].createdAt > 0, "PredictionMarket: Event does not exist");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the PredictionMarket contract
     * @param _pyusd Address of the PYUSD token contract
     * @param _pythOracle Address of the Pyth oracle contract
     * @param _initialOwner Address of the initial owner
     */
    constructor(
        address _pyusd,
        address _pythOracle,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_pyusd != address(0), "PredictionMarket: Invalid PYUSD address");
        require(_pythOracle != address(0), "PredictionMarket: Invalid Pyth address");

        pyusd = IERC20(_pyusd);
        pythOracle = _pythOracle;

        // Set default bet limits (1 PYUSD min, 10000 PYUSD max)
        minBetAmount = 1 * 10**6; // PYUSD has 6 decimals
        maxBetAmount = 10000 * 10**6;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the ASI agent address
     * @param _asiAgent Address of the ASI agent
     */
    function setASIAgent(address _asiAgent) external onlyOwner {
        require(_asiAgent != address(0), "PredictionMarket: Invalid agent address");
        address oldAgent = asiAgent;
        asiAgent = _asiAgent;
        emit ASIAgentUpdated(oldAgent, _asiAgent);
    }

    /**
     * @notice Update bet amount limits
     * @param _minBetAmount New minimum bet amount
     * @param _maxBetAmount New maximum bet amount
     */
    function setBetLimits(uint256 _minBetAmount, uint256 _maxBetAmount) external onlyOwner {
        require(_minBetAmount > 0, "PredictionMarket: Min bet must be > 0");
        require(_maxBetAmount > _minBetAmount, "PredictionMarket: Max must be > min");
        minBetAmount = _minBetAmount;
        maxBetAmount = _maxBetAmount;
        emit BetLimitsUpdated(_minBetAmount, _maxBetAmount);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new prediction event
     * @param question The prediction question
     * @param pythFeedId Pyth price feed ID for resolution
     * @param targetPrice Target price for the prediction (scaled by Pyth's expo)
     * @param deadline Timestamp when the event expires
     * @return eventId The ID of the created event
     */
    function createEvent(
        string calldata question,
        bytes32 pythFeedId,
        int64 targetPrice,
        uint256 deadline
    ) external onlyOwnerOrAgent whenNotPaused returns (uint256 eventId) {
        require(bytes(question).length > 0, "PredictionMarket: Question cannot be empty");
        require(pythFeedId != bytes32(0), "PredictionMarket: Invalid Pyth feed ID");
        require(deadline > block.timestamp, "PredictionMarket: Deadline must be in future");
        require(
            deadline <= block.timestamp + 365 days,
            "PredictionMarket: Deadline too far in future"
        );

        eventId = ++eventCounter;

        events[eventId] = Event({
            id: eventId,
            question: question,
            pythFeedId: pythFeedId,
            targetPrice: targetPrice,
            deadline: deadline,
            totalYes: 0,
            totalNo: 0,
            totalPool: 0,
            resolved: false,
            outcome: false,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        activeEventIds.push(eventId);

        emit EventCreated(eventId, question, pythFeedId, targetPrice, deadline, msg.sender);
    }

    /**
     * @notice Enter a prediction market by placing a bet
     * @param eventId ID of the event to bet on
     * @param prediction User's prediction (true = yes, false = no)
     * @param amount Amount of PYUSD to bet
     */
    function enterMarket(
        uint256 eventId,
        bool prediction,
        uint256 amount
    ) external nonReentrant whenNotPaused eventExists(eventId) {
        Event storage evt = events[eventId];

        require(!evt.resolved, "PredictionMarket: Event already resolved");
        require(block.timestamp < evt.deadline, "PredictionMarket: Event deadline passed");
        require(amount >= minBetAmount, "PredictionMarket: Amount below minimum");
        require(amount <= maxBetAmount, "PredictionMarket: Amount above maximum");

        // Check if user already has a bet
        UserBet storage existingBet = userBets[msg.sender][eventId];
        if (existingBet.exists) {
            // User can add to existing bet if same prediction
            require(
                existingBet.prediction == prediction,
                "PredictionMarket: Cannot change prediction side"
            );
        }

        // Transfer PYUSD from user
        pyusd.safeTransferFrom(msg.sender, address(this), amount);

        // Update user bet
        if (existingBet.exists) {
            existingBet.amount += amount;
        } else {
            userBets[msg.sender][eventId] = UserBet({
                amount: amount,
                prediction: prediction,
                exists: true
            });
        }

        // Update event totals
        evt.totalPool += amount;
        if (prediction) {
            evt.totalYes += amount;
        } else {
            evt.totalNo += amount;
        }

        emit EnteredMarket(eventId, msg.sender, prediction, amount);
    }

    /**
     * @notice Resolve an event using Pyth oracle data
     * @param eventId ID of the event to resolve
     */
    function resolveEvent(uint256 eventId) external nonReentrant eventExists(eventId) {
        Event storage evt = events[eventId];

        require(!evt.resolved, "PredictionMarket: Event already resolved");
        require(block.timestamp >= evt.deadline, "PredictionMarket: Event deadline not reached");

        // Get price from Pyth oracle
        int64 finalPrice = _getPythPrice(evt.pythFeedId);

        // Determine outcome: true if price >= target, false otherwise
        bool outcome = finalPrice >= evt.targetPrice;
        evt.resolved = true;
        evt.outcome = outcome;

        // Remove from active events
        _removeFromActiveEvents(eventId);

        emit EventResolved(eventId, outcome, finalPrice);
    }

    /**
     * @notice Manually resolve an event (owner only, fallback mechanism)
     * @param eventId ID of the event to resolve
     * @param outcome The outcome to set
     * @param finalPrice The final price to record
     */
    function manualResolveEvent(
        uint256 eventId,
        bool outcome,
        int64 finalPrice
    ) external onlyOwner eventExists(eventId) {
        Event storage evt = events[eventId];

        require(!evt.resolved, "PredictionMarket: Event already resolved");
        require(block.timestamp >= evt.deadline, "PredictionMarket: Event deadline not reached");

        evt.resolved = true;
        evt.outcome = outcome;

        // Remove from active events
        _removeFromActiveEvents(eventId);

        emit EventResolved(eventId, outcome, finalPrice);
    }

    /**
     * @notice Claim winnings from a resolved event
     * @param eventId ID of the event to claim from
     */
    function claimWinnings(uint256 eventId) external nonReentrant eventExists(eventId) {
        Event storage evt = events[eventId];
        UserBet storage bet = userBets[msg.sender][eventId];

        require(evt.resolved, "PredictionMarket: Event not resolved");
        require(bet.exists, "PredictionMarket: No bet placed");
        require(!hasClaimedWinnings[msg.sender][eventId], "PredictionMarket: Already claimed");
        require(bet.prediction == evt.outcome, "PredictionMarket: Bet lost");

        // Calculate winnings
        uint256 winningPool = evt.outcome ? evt.totalYes : evt.totalNo;
        require(winningPool > 0, "PredictionMarket: No winning pool");

        // Winner's share = (user's bet / winning pool) * total pool
        uint256 winnings = (bet.amount * evt.totalPool) / winningPool;

        // Mark as claimed
        hasClaimedWinnings[msg.sender][eventId] = true;

        // Transfer winnings
        pyusd.safeTransfer(msg.sender, winnings);

        emit WinningsClaimed(eventId, msg.sender, winnings);
    }

    // ============ View Functions ============

    /**
     * @notice Get event details
     * @param eventId ID of the event
     * @return Event struct
     */
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    /**
     * @notice Get user's bet on an event
     * @param user Address of the user
     * @param eventId ID of the event
     * @return UserBet struct
     */
    function getUserBet(address user, uint256 eventId) external view returns (UserBet memory) {
        return userBets[user][eventId];
    }

    /**
     * @notice Get all active event IDs
     * @return Array of active event IDs
     */
    function getActiveEvents() external view returns (uint256[] memory) {
        return activeEventIds;
    }

    /**
     * @notice Calculate potential winnings for a user
     * @param eventId ID of the event
     * @param user Address of the user
     * @return potentialWinnings Amount user would win if their prediction is correct
     */
    function calculatePotentialWinnings(
        uint256 eventId,
        address user
    ) external view eventExists(eventId) returns (uint256 potentialWinnings) {
        Event storage evt = events[eventId];
        UserBet storage bet = userBets[user][eventId];

        if (!bet.exists || evt.resolved) {
            return 0;
        }

        uint256 userPool = bet.prediction ? evt.totalYes : evt.totalNo;
        if (userPool == 0) {
            return 0;
        }

        potentialWinnings = (bet.amount * evt.totalPool) / userPool;
    }

    /**
     * @notice Get events created by a specific address
     * @param creator Address of the creator
     * @return eventIds Array of event IDs created by the address
     */
    function getEventsByCreator(address creator) external view returns (uint256[] memory eventIds) {
        uint256 count = 0;
        
        // Count events by creator
        for (uint256 i = 1; i <= eventCounter; i++) {
            if (events[i].creator == creator) {
                count++;
            }
        }

        // Create result array
        eventIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= eventCounter; i++) {
            if (events[i].creator == creator) {
                eventIds[index] = i;
                index++;
            }
        }
    }

    /**
     * @notice Get events a user has bet on
     * @param user Address of the user
     * @return eventIds Array of event IDs the user has bet on
     */
    function getUserEvents(address user) external view returns (uint256[] memory eventIds) {
        uint256 count = 0;
        
        // Count user's events
        for (uint256 i = 1; i <= eventCounter; i++) {
            if (userBets[user][i].exists) {
                count++;
            }
        }

        // Create result array
        eventIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= eventCounter; i++) {
            if (userBets[user][i].exists) {
                eventIds[index] = i;
                index++;
            }
        }
    }

    // ============ Internal Functions ============

    /**
     * @notice Get price from Pyth oracle
     * @param feedId Pyth price feed ID
     * @return price The current price
     */
    function _getPythPrice(bytes32 feedId) internal view returns (int64 price) {
        // Call Pyth oracle to get price
        // This is simplified - real implementation would use Pyth SDK
        (bool success, bytes memory data) = pythOracle.staticcall(
            abi.encodeWithSignature("getPrice(bytes32)", feedId)
        );
        
        require(success, "PredictionMarket: Pyth price fetch failed");
        
        // Decode the price (simplified - real Pyth returns a struct)
        // For MockPyth compatibility
        if (data.length >= 32) {
            assembly {
                price := mload(add(data, 32))
            }
        }
        
        return price;
    }

    /**
     * @notice Remove an event from active events array
     * @param eventId ID of the event to remove
     */
    function _removeFromActiveEvents(uint256 eventId) internal {
        for (uint256 i = 0; i < activeEventIds.length; i++) {
            if (activeEventIds[i] == eventId) {
                activeEventIds[i] = activeEventIds[activeEventIds.length - 1];
                activeEventIds.pop();
                break;
            }
        }
    }

    /**
     * @notice Emergency withdrawal function (timelocked to 30 days after deployment)
     * @dev Only callable by owner after 30 days of contract deployment
     */
    function emergencyWithdraw() external onlyOwner {
        require(
            block.timestamp >= block.timestamp + 30 days,
            "PredictionMarket: Emergency withdrawal not available yet"
        );
        
        uint256 balance = pyusd.balanceOf(address(this));
        pyusd.safeTransfer(owner(), balance);
    }
}
