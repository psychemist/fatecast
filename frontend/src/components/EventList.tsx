'use client';

import { useState } from 'react';
import { useActiveEvents } from '@/hooks/useEvents';
import { BetModal } from './BetModal';
import { EventCard } from './EventCard';

export function EventList() {
  const { eventIds, isLoading } = useActiveEvents();
  const [selectedEventId, setSelectedEventId] = useState<bigint | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!eventIds || eventIds.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
        <div className="max-w-md mx-auto px-6">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 text-lg font-semibold mb-2">No Active Events</p>
          <p className="text-gray-500 text-sm mb-4">
            There are currently no prediction markets available.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-blue-900 text-sm font-medium mb-2">💡 To create events:</p>
            <ol className="text-blue-800 text-xs space-y-1 ml-4 list-decimal">
              <li>Run the ASI agent: <code className="bg-blue-100 px-1 rounded">cd asi-agent && npm run create-events</code></li>
              <li>Or start the continuous agent: <code className="bg-blue-100 px-1 rounded">npm run dev</code></li>
              <li>Refresh this page after events are created</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventIds.map((eventId) => (
          <EventCard
            key={eventId.toString()}
            eventId={eventId}
            onBetClick={setSelectedEventId}
          />
        ))}
      </div>

      {selectedEventId !== null && (
        <BetModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </>
  );
}
