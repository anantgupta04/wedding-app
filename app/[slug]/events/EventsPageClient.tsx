'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EventCard, type Event, type RsvpBreakdown } from '@/components/events/EventCard'
import { AddEventModal } from '@/components/events/AddEventModal'

interface Props {
  wedding: { id: string; name: string; slug: string }
  events: Event[]
  guestCountMap: Record<string, number>
  rsvpMap: Record<string, RsvpBreakdown>
}

export function EventsPageClient({ wedding, events, guestCountMap, rsvpMap }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
          + Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
          <p className="text-gray-500">No events yet.</p>
          <p className="text-sm text-gray-400">Add your first ceremony — Mehendi, Sangam, Wedding…</p>
          <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
            + Add your first event
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              guestCount={guestCountMap[event.id] ?? 0}
              rsvpBreakdown={rsvpMap[event.id] ?? { yes: 0, no: 0, pending: 0 }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddEventModal weddingId={wedding.id} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
