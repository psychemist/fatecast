'use client';

import { useEventActivities } from '@/hooks/useEvents';
import { getTxUrl } from '@/lib/blockscout';
import { truncateAddress } from '@/lib/utils';

export function ActivityFeed() {
  const { activities, isLoading } = useEventActivities(20);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <div
          key={`${activity.txHash}-${index}`}
          className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {/* Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            activity.type === 'created' ? 'bg-blue-100 text-blue-600' :
            activity.type === 'bet' ? 'bg-purple-100 text-purple-600' :
            activity.type === 'resolved' ? 'bg-green-100 text-green-600' :
            'bg-yellow-100 text-yellow-600'
          }`}>
            {activity.type === 'created' && '✨'}
            {activity.type === 'bet' && '🎯'}
            {activity.type === 'resolved' && '✅'}
            {activity.type === 'claimed' && '💰'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              {activity.type === 'created' && (
                <>
                  <span className="font-medium">{truncateAddress(activity.user || '')}</span>
                  {' '}created a new event
                </>
              )}
              {activity.type === 'bet' && (
                <>
                  <span className="font-medium">{truncateAddress(activity.user || '')}</span>
                  {' '}bet{' '}
                  <span className="font-semibold">{activity.amount} PYUSD</span>
                  {' '}on{' '}
                  <span className={`font-semibold ${activity.prediction ? 'text-green-600' : 'text-red-600'}`}>
                    {activity.prediction ? 'YES' : 'NO'}
                  </span>
                </>
              )}
              {activity.type === 'resolved' && (
                <>Event #{activity.eventId} was resolved</>
              )}
              {activity.type === 'claimed' && (
                <>
                  <span className="font-medium">{truncateAddress(activity.user || '')}</span>
                  {' '}claimed{' '}
                  <span className="font-semibold text-green-600">{activity.amount} PYUSD</span>
                </>
              )}
            </p>
            <a
              href={getTxUrl(activity.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              {truncateAddress(activity.txHash)}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
