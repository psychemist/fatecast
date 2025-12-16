// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";
import "../src/mocks/MockPYUSD.sol";
import "../src/mocks/MockPyth.sol";

/**
 * @title PredictionMarketTest
 * @notice Comprehensive test suite for PredictionMarket contract
 */
contract PredictionMarketTest is Test {
    PredictionMarket public market;
    MockPYUSD public pyusd;
    MockPyth public pyth;

    // Test accounts
    address public owner = address(1);
    address public agent = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public user3 = address(5);

    // Test constants
    bytes32 constant BTC_FEED_ID = bytes32(uint256(1));
    bytes32 constant ETH_FEED_ID = bytes32(uint256(2));
    int64 constant TARGET_PRICE = 50000 * 1e8; // $50,000 with 8 decimals
    uint256 constant DEADLINE_OFFSET = 7 days;
    uint256 constant BET_AMOUNT = 100 * 1e6; // 100 PYUSD (6 decimals)

    // Events to test
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

    function setUp() public {
        // Deploy mock contracts
        vm.startPrank(owner);
        pyusd = new MockPYUSD();
        pyth = new MockPyth();
        market = new PredictionMarket(address(pyusd), address(pyth), owner);
        
        // Set ASI agent
        market.setASIAgent(agent);
        vm.stopPrank();

        // Fund test users with PYUSD
        pyusd.mint(user1, 10000 * 1e6); // 10,000 PYUSD
        pyusd.mint(user2, 10000 * 1e6);
        pyusd.mint(user3, 10000 * 1e6);

        // Setup Pyth price
        pyth.setPrice(
            BTC_FEED_ID,
            TARGET_PRICE,
            100,
            -8,
            block.timestamp
        );

        // Label addresses for better traces
        vm.label(owner, "Owner");
        vm.label(agent, "Agent");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
        vm.label(user3, "User3");
        vm.label(address(market), "PredictionMarket");
        vm.label(address(pyusd), "PYUSD");
        vm.label(address(pyth), "Pyth");
    }

    // ============ Phase 3.2: Event Creation Tests ============

    function testCreateEventByOwner() public {
        vm.startPrank(owner);
        
        uint256 deadline = block.timestamp + DEADLINE_OFFSET;
        string memory question = "Will BTC reach $50k by next week?";

        vm.expectEmit(true, true, true, true);
        emit EventCreated(1, question, BTC_FEED_ID, TARGET_PRICE, deadline, owner);

        uint256 eventId = market.createEvent(question, BTC_FEED_ID, TARGET_PRICE, deadline);

        assertEq(eventId, 1, "Event ID should be 1");

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.id, 1);
        assertEq(evt.question, question);
        assertEq(evt.pythFeedId, BTC_FEED_ID);
        assertEq(evt.targetPrice, TARGET_PRICE);
        assertEq(evt.deadline, deadline);
        assertEq(evt.totalYes, 0);
        assertEq(evt.totalNo, 0);
        assertEq(evt.totalPool, 0);
        assertEq(evt.resolved, false);
        assertEq(evt.creator, owner);

        vm.stopPrank();
    }

    function testCreateEventByAgent() public {
        vm.startPrank(agent);
        
        uint256 deadline = block.timestamp + DEADLINE_OFFSET;
        string memory question = "Will ETH reach $3k?";

        uint256 eventId = market.createEvent(question, ETH_FEED_ID, TARGET_PRICE, deadline);

        assertEq(eventId, 1);
        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.creator, agent);

        vm.stopPrank();
    }

    function testCreateEventUnauthorizedFails() public {
        vm.startPrank(user1);
        
        uint256 deadline = block.timestamp + DEADLINE_OFFSET;
        
        vm.expectRevert("PredictionMarket: Caller is not owner or agent");
        market.createEvent("Test?", BTC_FEED_ID, TARGET_PRICE, deadline);

        vm.stopPrank();
    }

    function testCreateEventInvalidDeadlineFails() public {
        vm.startPrank(owner);
        
        // Deadline in the past
        vm.expectRevert("PredictionMarket: Deadline must be in future");
        market.createEvent("Test?", BTC_FEED_ID, TARGET_PRICE, block.timestamp - 1);

        // Deadline too far in future
        vm.expectRevert("PredictionMarket: Deadline too far in future");
        market.createEvent("Test?", BTC_FEED_ID, TARGET_PRICE, block.timestamp + 366 days);

        vm.stopPrank();
    }

    function testCreateEventEmptyQuestionFails() public {
        vm.startPrank(owner);
        
        vm.expectRevert("PredictionMarket: Question cannot be empty");
        market.createEvent("", BTC_FEED_ID, TARGET_PRICE, block.timestamp + DEADLINE_OFFSET);

        vm.stopPrank();
    }

    function testCreateEventInvalidFeedIdFails() public {
        vm.startPrank(owner);
        
        vm.expectRevert("PredictionMarket: Invalid Pyth feed ID");
        market.createEvent("Test?", bytes32(0), TARGET_PRICE, block.timestamp + DEADLINE_OFFSET);

        vm.stopPrank();
    }

    // ============ Phase 3.3: Market Entry Tests ============

    function testEnterMarketYes() public {
        uint256 eventId = _createTestEvent();

        vm.startPrank(user1);
        pyusd.approve(address(market), BET_AMOUNT);

        uint256 balanceBefore = pyusd.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit EnteredMarket(eventId, user1, true, BET_AMOUNT);

        market.enterMarket(eventId, true, BET_AMOUNT);

        uint256 balanceAfter = pyusd.balanceOf(user1);
        assertEq(balanceBefore - balanceAfter, BET_AMOUNT);

        PredictionMarket.UserBet memory bet = market.getUserBet(user1, eventId);
        assertEq(bet.amount, BET_AMOUNT);
        assertEq(bet.prediction, true);
        assertEq(bet.exists, true);

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.totalYes, BET_AMOUNT);
        assertEq(evt.totalNo, 0);
        assertEq(evt.totalPool, BET_AMOUNT);

        vm.stopPrank();
    }

    function testEnterMarketNo() public {
        uint256 eventId = _createTestEvent();

        vm.startPrank(user2);
        pyusd.approve(address(market), BET_AMOUNT);

        market.enterMarket(eventId, false, BET_AMOUNT);

        PredictionMarket.UserBet memory bet = market.getUserBet(user2, eventId);
        assertEq(bet.prediction, false);

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.totalNo, BET_AMOUNT);
        assertEq(evt.totalPool, BET_AMOUNT);

        vm.stopPrank();
    }

    function testEnterMarketMultipleBets() public {
        uint256 eventId = _createTestEvent();

        // User1 bets YES
        vm.startPrank(user1);
        pyusd.approve(address(market), BET_AMOUNT * 2);
        market.enterMarket(eventId, true, BET_AMOUNT);
        vm.stopPrank();

        // User2 bets NO
        vm.startPrank(user2);
        pyusd.approve(address(market), BET_AMOUNT);
        market.enterMarket(eventId, false, BET_AMOUNT);
        vm.stopPrank();

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.totalYes, BET_AMOUNT);
        assertEq(evt.totalNo, BET_AMOUNT);
        assertEq(evt.totalPool, BET_AMOUNT * 2);
    }

    function testEnterMarketAddToExistingBet() public {
        uint256 eventId = _createTestEvent();

        vm.startPrank(user1);
        pyusd.approve(address(market), BET_AMOUNT * 3);

        // First bet
        market.enterMarket(eventId, true, BET_AMOUNT);
        
        // Add to existing bet
        market.enterMarket(eventId, true, BET_AMOUNT * 2);

        PredictionMarket.UserBet memory bet = market.getUserBet(user1, eventId);
        assertEq(bet.amount, BET_AMOUNT * 3);

        vm.stopPrank();
    }

    function testEnterMarketChangePredictionFails() public {
        uint256 eventId = _createTestEvent();

        vm.startPrank(user1);
        pyusd.approve(address(market), BET_AMOUNT * 2);

        market.enterMarket(eventId, true, BET_AMOUNT);

        vm.expectRevert("PredictionMarket: Cannot change prediction side");
        market.enterMarket(eventId, false, BET_AMOUNT);

        vm.stopPrank();
    }

    function testEnterMarketExpiredEventFails() public {
        uint256 eventId = _createTestEvent();

        // Warp past deadline
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.startPrank(user1);
        pyusd.approve(address(market), BET_AMOUNT);

        vm.expectRevert("PredictionMarket: Event deadline passed");
        market.enterMarket(eventId, true, BET_AMOUNT);

        vm.stopPrank();
    }

    function testEnterMarketResolvedEventFails() public {
        uint256 eventId = _createTestEvent();

        // Resolve the event
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);

        vm.startPrank(user1);
        pyusd.approve(address(market), BET_AMOUNT);

        vm.expectRevert("PredictionMarket: Event already resolved");
        market.enterMarket(eventId, true, BET_AMOUNT);

        vm.stopPrank();
    }

    function testEnterMarketBelowMinimumFails() public {
        uint256 eventId = _createTestEvent();

        vm.startPrank(user1);
        pyusd.approve(address(market), 1);

        vm.expectRevert("PredictionMarket: Amount below minimum");
        market.enterMarket(eventId, true, 1);

        vm.stopPrank();
    }

    function testEnterMarketAboveMaximumFails() public {
        uint256 eventId = _createTestEvent();

        uint256 maxAmount = 10001 * 1e6; // Above default max
        pyusd.mint(user1, maxAmount);

        vm.startPrank(user1);
        pyusd.approve(address(market), maxAmount);

        vm.expectRevert("PredictionMarket: Amount above maximum");
        market.enterMarket(eventId, true, maxAmount);

        vm.stopPrank();
    }

    // ============ Phase 3.4: Event Resolution Tests ============

    function testResolveEventAboveTarget() public {
        uint256 eventId = _createTestEvent();
        _placeBets(eventId);

        // Set price above target
        pyth.setPrice(BTC_FEED_ID, TARGET_PRICE + 1000, 100, -8, block.timestamp);

        // Warp past deadline
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.expectEmit(true, false, false, true);
        emit EventResolved(eventId, true, TARGET_PRICE + 1000);

        market.resolveEvent(eventId);

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.resolved, true);
        assertEq(evt.outcome, true); // YES wins
    }

    function testResolveEventBelowTarget() public {
        uint256 eventId = _createTestEvent();
        _placeBets(eventId);

        // Set price below target
        pyth.setPrice(BTC_FEED_ID, TARGET_PRICE - 1000, 100, -8, block.timestamp);

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        market.resolveEvent(eventId);

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.resolved, true);
        assertEq(evt.outcome, false); // NO wins
    }

    function testResolveEventBeforeDeadlineFails() public {
        uint256 eventId = _createTestEvent();

        vm.expectRevert("PredictionMarket: Event deadline not reached");
        market.resolveEvent(eventId);
    }

    function testResolveEventDoubleFails() public {
        uint256 eventId = _createTestEvent();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);

        vm.expectRevert("PredictionMarket: Event already resolved");
        market.resolveEvent(eventId);
    }

    function testManualResolveEventByOwner() public {
        uint256 eventId = _createTestEvent();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(owner);
        market.manualResolveEvent(eventId, true, TARGET_PRICE);

        PredictionMarket.Event memory evt = market.getEvent(eventId);
        assertEq(evt.resolved, true);
        assertEq(evt.outcome, true);
    }

    // ============ Phase 3.5: Claims Tests ============

    function testClaimWinningsYesWins() public {
        uint256 eventId = _createTestEvent();

        // User1 bets 100 YES, User2 bets 100 NO
        vm.prank(user1);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user1);
        market.enterMarket(eventId, true, BET_AMOUNT);

    // Assert bet recorded for user1
    PredictionMarket.UserBet memory bet1 = market.getUserBet(user1, eventId);
    assertEq(bet1.exists, true);
    assertEq(bet1.amount, BET_AMOUNT);

        vm.prank(user2);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user2);
        market.enterMarket(eventId, false, BET_AMOUNT);

        // Resolve with YES winning
        pyth.setPrice(BTC_FEED_ID, TARGET_PRICE + 1000, 100, -8, block.timestamp);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);

        // User1 should win entire pool (200 PYUSD)
        uint256 balanceBefore = pyusd.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit WinningsClaimed(eventId, user1, BET_AMOUNT * 2);

        vm.prank(user1);
        market.claimWinnings(eventId);

        uint256 balanceAfter = pyusd.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, BET_AMOUNT * 2);
    }

    function testClaimWinningsProportional() public {
        uint256 eventId = _createTestEvent();

        // User1 bets 100 YES, User2 bets 200 YES, User3 bets 300 NO
        vm.prank(user1);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user1);
        market.enterMarket(eventId, true, BET_AMOUNT);

        vm.prank(user2);
        pyusd.approve(address(market), BET_AMOUNT * 2);
        vm.prank(user2);
        market.enterMarket(eventId, true, BET_AMOUNT * 2);

    // Assert bet recorded for user2
    PredictionMarket.UserBet memory bet2 = market.getUserBet(user2, eventId);
    assertEq(bet2.exists, true);
    assertEq(bet2.amount, BET_AMOUNT * 2);

        vm.prank(user3);
        pyusd.approve(address(market), BET_AMOUNT * 3);
        vm.prank(user3);
        market.enterMarket(eventId, false, BET_AMOUNT * 3);

    // Assert bet recorded for user3
    PredictionMarket.UserBet memory bet3 = market.getUserBet(user3, eventId);
    assertEq(bet3.exists, true);
    assertEq(bet3.amount, BET_AMOUNT * 3);

        // Total pool: 600, YES pool: 300, NO pool: 300
        // Resolve with YES winning
        pyth.setPrice(BTC_FEED_ID, TARGET_PRICE + 1000, 100, -8, block.timestamp);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);

        // User1 should get: (100/300) * 600 = 200
        uint256 balance1Before = pyusd.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(eventId);
        uint256 balance1After = pyusd.balanceOf(user1);
        assertEq(balance1After - balance1Before, 200 * 1e6);

        // User2 should get: (200/300) * 600 = 400
        uint256 balance2Before = pyusd.balanceOf(user2);
        vm.prank(user2);
        market.claimWinnings(eventId);
        uint256 balance2After = pyusd.balanceOf(user2);
        assertEq(balance2After - balance2Before, 400 * 1e6);
    }

    function testClaimWinningsLoserFails() public {
        uint256 eventId = _createTestEvent();
        _placeBetsAndResolve(eventId, true); // YES wins

        vm.prank(user2); // User2 bet NO
        vm.expectRevert("PredictionMarket: Bet lost");
        market.claimWinnings(eventId);
    }

    function testClaimWinningsDoubleFails() public {
        uint256 eventId = _createTestEvent();
        _placeBetsAndResolve(eventId, true);

        vm.prank(user1);
        market.claimWinnings(eventId);

        vm.prank(user1);
        vm.expectRevert("PredictionMarket: Already claimed");
        market.claimWinnings(eventId);
    }

    function testClaimWinningsBeforeResolutionFails() public {
        uint256 eventId = _createTestEvent();
        _placeBets(eventId);

        vm.prank(user1);
        vm.expectRevert("PredictionMarket: Event not resolved");
        market.claimWinnings(eventId);
    }

    function testClaimWinningsNoBetFails() public {
        uint256 eventId = _createTestEvent();
        
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);

        vm.prank(user3); // User3 didn't bet
        vm.expectRevert("PredictionMarket: No bet placed");
        market.claimWinnings(eventId);
    }

    // ============ Phase 3.6: Integration Tests ============

    function testFullLifecycle() public {
        // 1. Create event
        vm.prank(owner);
        uint256 eventId = market.createEvent(
            "Will BTC reach $50k?",
            BTC_FEED_ID,
            TARGET_PRICE,
            block.timestamp + DEADLINE_OFFSET
        );

        // 2. Multiple users bet
        vm.prank(user1);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user1);
        market.enterMarket(eventId, true, BET_AMOUNT);

        vm.prank(user2);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user2);
        market.enterMarket(eventId, false, BET_AMOUNT);

        // 3. Resolve event
        pyth.setPrice(BTC_FEED_ID, TARGET_PRICE + 1000, 100, -8, block.timestamp);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);

        // 4. Winner claims
        uint256 balanceBefore = pyusd.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(eventId);
        uint256 balanceAfter = pyusd.balanceOf(user1);

        assertEq(balanceAfter - balanceBefore, BET_AMOUNT * 2);
    }

    function testMultipleConcurrentEvents() public {
        // Create 3 events
        vm.startPrank(owner);
        uint256 event1 = market.createEvent("Event 1", BTC_FEED_ID, TARGET_PRICE, block.timestamp + 1 days);
        uint256 event2 = market.createEvent("Event 2", ETH_FEED_ID, TARGET_PRICE, block.timestamp + 2 days);
        uint256 event3 = market.createEvent("Event 3", BTC_FEED_ID, TARGET_PRICE, block.timestamp + 3 days);
        vm.stopPrank();

        assertEq(event1, 1);
        assertEq(event2, 2);
        assertEq(event3, 3);

        // Verify all are active
        uint256[] memory activeEvents = market.getActiveEvents();
        assertEq(activeEvents.length, 3);
    }

    function testPauseUnpause() public {
        uint256 eventId = _createTestEvent();

        // Pause contract
        vm.prank(owner);
        market.pause();

        // Cannot bet while paused
    vm.prank(user1);
    pyusd.approve(address(market), BET_AMOUNT);
    vm.prank(user1);
    // OpenZeppelin Pausable now reverts with a custom error EnforcedPause()
    vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("EnforcedPause()"))));
    market.enterMarket(eventId, true, BET_AMOUNT);

        // Unpause
        vm.prank(owner);
        market.unpause();

        // Can bet after unpause
        vm.prank(user1);
        market.enterMarket(eventId, true, BET_AMOUNT);

        PredictionMarket.UserBet memory bet = market.getUserBet(user1, eventId);
        assertEq(bet.exists, true);
    }

    // ============ Helper Functions ============

    function _createTestEvent() internal returns (uint256) {
        vm.prank(owner);
        return market.createEvent(
            "Test Event",
            BTC_FEED_ID,
            TARGET_PRICE,
            block.timestamp + DEADLINE_OFFSET
        );
    }

    function _placeBets(uint256 eventId) internal {
        vm.prank(user1);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user1);
        market.enterMarket(eventId, true, BET_AMOUNT);

        vm.prank(user2);
        pyusd.approve(address(market), BET_AMOUNT);
        vm.prank(user2);
        market.enterMarket(eventId, false, BET_AMOUNT);
    }

    function _placeBetsAndResolve(uint256 eventId, bool outcome) internal {
        _placeBets(eventId);

        int64 finalPrice = outcome ? TARGET_PRICE + 1000 : TARGET_PRICE - 1000;
        pyth.setPrice(BTC_FEED_ID, finalPrice, 100, -8, block.timestamp);

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        market.resolveEvent(eventId);
    }
}
