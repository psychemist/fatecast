'use client';

import { useUserBettingHistory } from '@/hooks/useUserBets';
import { useEvent } from '@/hooks/useEvents';
import { usePotentialWinnings, useHasClaimedWinnings } from '@/hooks/useUserBets';
import { useWritePredictionMarket } from '@/hooks/useContract';
import { getTxUrl } from '@/lib/blockscout';
import { truncateAddress } from '@/lib/utils';

interface UserPositionItemProps {
  eventId: string;
  amount: string;
  prediction: boolean;
  txHash: string;
}

function UserPositionItem({ eventId, amount, prediction, txHash }: UserPositionItemProps) {
  const { event } = useEvent(BigInt(eventId));
  const { winnings } = usePotentialWinnings(BigInt(eventId));
  const { hasClaimed } = useHasClaimedWinnings(BigInt(eventId));
  const { write: claim, isPending: isClaiming, isSuccess } = useWritePredictionMarket();

  if (!event) return null;

  const handleClaim = () => {
    claim('claimWinnings', [BigInt(eventId)]);
  };

  const isWinner = event.resolved && event.outcome === prediction;
  const canClaim = event.resolved && isWinner && !hasClaimed;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{event.question}</h4>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              prediction 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {prediction ? 'YES' : 'NO'}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {amount} PYUSD
            </span>
            {event.resolved && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isWinner 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isWinner ? '✓ Won' : '✗ Lost'}
              </span>
            )}
          </div>
        </div>
      </div>

      {event.resolved && isWinner && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-600">Winnings: </span>
              <span className="font-semibold text-green-600">
                {(Number(winnings) / 1e6).toFixed(2)} PYUSD
              </span>
            </div>
            {canClaim && !isSuccess && (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isClaiming ? 'Claiming...' : 'Claim'}
              </button>
            )}
            {hasClaimed && (
              <span className="text-green-600 text-sm font-medium">✓ Claimed</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <a
          href={getTxUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors"
        >
          Tx: {truncateAddress(txHash)}
        </a>
      </div>
    </div>
  );
}

export function UserPositions() {
  const { history, isLoading } = useUserBettingHistory();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg">
        <p className="text-gray-500">No bets placed yet</p>
        <p className="text-gray-400 text-sm mt-2">Start predicting to see your positions here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((bet, index) => (
        <UserPositionItem
          key={`${bet.eventId}-${index}`}
          eventId={bet.eventId}
          amount={bet.amount}
          prediction={bet.prediction}
          txHash={bet.txHash}
        />
      ))}
    </div>
  );
}
