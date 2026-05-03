'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface Event {
  id: string
  wedding_id: string
  name: string
  date: string | null
  time: string | null
  venue: string | null
  venue_map_url: string | null
  dress_code: string | null
  notes: string | null
  created_at: string
}

export interface RsvpBreakdown {
  yes: number
  no: number
  pending: number
}

interface EventCardProps {
  event: Event
  guestCount: number
  rsvpBreakdown: RsvpBreakdown
}

function formatDateTime(date: string | null, time: string | null): string {
  if (!date) return 'Date TBD'
  const d = new Date(date)
  const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  return time ? `${formatted} at ${time.slice(0, 5)}` : formatted
}

export function EventCard({ event, guestCount, rsvpBreakdown }: EventCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    const { error: err } = await supabase.from('events').delete().eq('id', event.id)
    if (err) {
      setError(err.message)
      setDeleting(false)
      return
    }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{event.name}</h2>
          <p className="text-sm text-gray-500">{formatDateTime(event.date, event.time)}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 shrink-0"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {event.venue && (
        <div className="text-sm text-gray-600">
          {event.venue_map_url ? (
            <a href={event.venue_map_url} target="_blank" rel="noopener noreferrer"
               className="text-purple-600 hover:underline">
              {event.venue}
            </a>
          ) : event.venue}
        </div>
      )}

      {event.dress_code && (
        <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          Dress code: {event.dress_code}
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {guestCount} invited
        </span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          {rsvpBreakdown.yes} confirmed
        </span>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
          {rsvpBreakdown.pending} pending
        </span>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
          {rsvpBreakdown.no} declined
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
