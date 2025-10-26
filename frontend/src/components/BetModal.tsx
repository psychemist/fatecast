'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEvent } from '@/hooks/useEvents';
import { usePYUSDBalance, usePYUSDAllowance, useApprovePYUSD } from '@/hooks/usePYUSD';
import { useWritePredictionMarket } from '@/hooks/useContract';
import { PREDICTION_MARKET_ADDRESS } from '@/config/contracts';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

interface BetModalProps {
  eventId: bigint;
  onClose: () => void;
}

export function BetModal({ eventId, onClose }: BetModalProps) {
  const { address } = useAccount();
  const { event } = useEvent(eventId);
  const { balance } = usePYUSDBalance();
  const { allowance } = usePYUSDAllowance(PREDICTION_MARKET_ADDRESS);
  const { approve, hash: approveHash, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: approvalSuccess } = useApprovePYUSD();
  const { write: placeBet, hash: betHash, isSuccess: betSuccess, isPending: isBetting, error: betError } = useWritePredictionMarket();

  const [prediction, setPrediction] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if event is still active (check once when component mounts)
  const [isEventActive] = useState(() => {
    if (!event) return false;
    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(event.deadline);
    return !event.resolved && now < deadline;
  });

  // Min bet is 1 PYUSD (1,000,000 with 6 decimals)
  const MIN_BET = 1;
  const MAX_BET = 10000;

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (amount && allowance !== undefined) {
      const amountWei = ethers.parseUnits(amount || '0', 6);
      return allowance < amountWei;
    }
    return false;
  }, [amount, allowance]);

  const handlePlaceBet = () => {
    const amountWei = ethers.parseUnits(amount, 6);
    placeBet('enterMarket', [eventId, prediction, amountWei]);
  };

  const handleApproveAndBet = async () => {
    setIsProcessing(true);
     const amountWei = ethers.parseUnits(amount, 6);
    
    if (needsApproval) {
      // Approve first, bet will happen automatically via useEffect
      approve(PREDICTION_MARKET_ADDRESS, amountWei);
    } else {
      // Already approved, just bet
      handlePlaceBet();
    }
  };

  // Auto-proceed to bet after approval is CONFIRMED on-chain
  useEffect(() => {
    if (approvalSuccess && isProcessing) {
      // Approval confirmed! Now place the bet
      const amountWei = ethers.parseUnits(amount, 6);
      placeBet('enterMarket', [eventId, prediction, amountWei]);
      
      // Reset processing state after a short delay
      const timer = setTimeout(() => setIsProcessing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [approvalSuccess, isProcessing, amount, eventId, prediction, placeBet]);

  const totalYes = Number(ethers.formatUnits(event.totalYes, 6));
  const totalNo = Number(ethers.formatUnits(event.totalNo, 6));
  const totalPool = Number(ethers.formatUnits(event.totalPool, 6));
  const betAmount = parseFloat(amount || '0');

  // Calculate potential winnings
  const potentialPayout = betAmount > 0 
    ? prediction 
      ? (betAmount * (totalPool + betAmount)) / (totalYes + betAmount)
      : (betAmount * (totalPool + betAmount)) / (totalNo + betAmount)
    : 0;

  const potentialProfit = potentialPayout - betAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Place Your Bet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question */}
        <p className="text-gray-700 mb-6">{event.question}</p>

        {/* Prediction Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Prediction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPrediction(true)}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                prediction
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              YES
            </button>
            <button
              onClick={() => setPrediction(false)}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                !prediction
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              NO
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (PYUSD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min={MIN_BET}
            max={MAX_BET}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Balance: {ethers.formatUnits(balance, 6)} PYUSD</span>
            <button
              onClick={() => setAmount(ethers.formatUnits(balance, 6))}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Max
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Min: {MIN_BET} PYUSD • Max: {MAX_BET} PYUSD
          </p>
        </div>

        {/* Potential Winnings */}
        {betAmount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Potential Payout</span>
              <span className="font-semibold text-gray-900">
                {potentialPayout.toFixed(2)} PYUSD
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Potential Profit</span>
              <span className={`font-semibold ${potentialProfit > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                +{potentialProfit.toFixed(2)} PYUSD
              </span>
            </div>
          </div>
        )}

        {/* Action Button - Single button that handles everything */}
        <div className="space-y-3">
          {!isEventActive && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ This event has expired or been resolved. You cannot place bets.
              </p>
            </div>
          )}
          
          <button
            onClick={handleApproveAndBet}
            disabled={!isEventActive || isProcessing || isApproving || isApprovingConfirming || isBetting || !amount || parseFloat(amount) < MIN_BET || parseFloat(amount) > MAX_BET || parseFloat(amount) > Number(ethers.formatUnits(balance, 6))}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isApproving || isApprovingConfirming ? 'Approving...' : isBetting ? 'Placing Bet...' : needsApproval ? 'Approve & Place Bet' : 'Place Bet'}
          </button>
          
          {needsApproval && (
            <p className="text-xs text-gray-500 text-center">
              You&apos;ll be asked to approve PYUSD first, then the bet will be placed automatically
            </p>
          )}
        </div>

        {betSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              ✓ Bet placed successfully!
            </p>
          </div>
        )}

        {betError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              ✗ Error: {betError.message || 'Transaction failed'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
