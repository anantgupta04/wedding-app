'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { AddGuestModal } from './AddGuestModal'

interface Event {
  id: string
  name: string
}

interface GuestEvent {
  event_id: string
  rsvp_status: string
}

interface Guest {
  id: string
  name: string
  email: string | null
  phone: string | null
  side: string | null
  has_plus_one: boolean
  plus_one_name: string | null
  dietary: string[]
  accommodation: boolean
  notes: string | null
  guest_events: GuestEvent[]
}

interface GuestListClientProps {
  weddingId: string
  guests: Guest[]
  events: Event[]
}

const SIDE_STYLES: Record<string, string> = {
  bride: 'bg-pink-100 text-pink-700',
  groom: 'bg-blue-100 text-blue-700',
  mutual: 'bg-purple-100 text-purple-700',
}

const RSVP_STYLES: Record<string, string> = {
  yes: 'bg-green-100 text-green-700',
  no: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
}

function downloadCSV(guests: Guest[], events: Event[]) {
  const headers = ['Name', 'Email', 'Phone', 'Side', 'Dietary', '+1 Name', 'Accommodation', 'Notes']
  const rows = guests.map(g => [
    g.name,
    g.email ?? '',
    g.phone ?? '',
    g.side ?? '',
    g.dietary.join('; '),
    g.plus_one_name ?? '',
    g.accommodation ? 'Yes' : 'No',
    g.notes ?? '',
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'guests.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function GuestListClient({ weddingId, guests, events }: GuestListClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [sideFilter, setSideFilter] = useState('all')
  const [rsvpFilter, setRsvpFilter] = useState('all')

  const filtered = useMemo(() => {
    return guests.filter(g => {
      if (search) {
        const q = search.toLowerCase()
        const match = g.name.toLowerCase().includes(q) ||
          (g.email ?? '').toLowerCase().includes(q) ||
          (g.phone ?? '').includes(q)
        if (!match) return false
      }
      if (sideFilter !== 'all' && g.side !== sideFilter) return false
      if (rsvpFilter !== 'all') {
        const statuses = g.guest_events.map(ge => ge.rsvp_status)
        if (!statuses.includes(rsvpFilter)) return false
      }
      return true
    })
  }, [guests, search, sideFilter, rsvpFilter])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{guests.length} total</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => downloadCSV(guests, events)} className="text-xs">
            Export CSV
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
            + Add Guest
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <input
          type="search"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'bride', 'groom', 'mutual'].map(s => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                sideFilter === s
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {s === 'all' ? 'All sides' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="w-px bg-gray-200 self-stretch mx-1" />
          {['all', 'yes', 'pending', 'no'].map(s => (
            <button
              key={s}
              onClick={() => setRsvpFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                rsvpFilter === s
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {s === 'all' ? 'All RSVPs' : s === 'yes' ? 'Confirmed' : s === 'no' ? 'Declined' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-400">{guests.length === 0 ? 'No guests yet. Add your first guest!' : 'No guests match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(guest => (
            <div key={guest.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{guest.name}</span>
                    {guest.side && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SIDE_STYLES[guest.side] ?? 'bg-gray-100 text-gray-600'}`}>
                        {guest.side}
                      </span>
                    )}
                    {guest.has_plus_one && (
                      <span className="text-xs text-gray-400">+1{guest.plus_one_name ? `: ${guest.plus_one_name}` : ''}</span>
                    )}
                    {guest.accommodation && (
                      <span className="text-xs text-blue-500">🏨</span>
                    )}
                  </div>
                  {(guest.email || guest.phone) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[guest.email, guest.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {guest.dietary.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {guest.dietary.map(d => (
                    <span key={d} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{d}</span>
                  ))}
                </div>
              )}

              {guest.guest_events.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {guest.guest_events.map(ge => {
                    const ev = events.find(e => e.id === ge.event_id)
                    return (
                      <span key={ge.event_id} className={`text-xs px-2 py-0.5 rounded-full ${RSVP_STYLES[ge.rsvp_status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {ev?.name ?? 'Event'}: {ge.rsvp_status}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddGuestModal weddingId={weddingId} events={events} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
