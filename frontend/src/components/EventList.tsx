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

  if (eventIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No active events at the moment</p>
        <p className="text-gray-400 text-sm mt-2">Check back soon for new prediction markets!</p>
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
