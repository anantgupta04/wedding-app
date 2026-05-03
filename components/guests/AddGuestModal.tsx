'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  name: string
}

interface AddGuestModalProps {
  weddingId: string
  events: Event[]
  onClose: () => void
}

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Jain', 'Halal', 'No restrictions', 'Other']

export function AddGuestModal({ weddingId, events, onClose }: AddGuestModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [side, setSide] = useState<'bride' | 'groom' | 'mutual'>('mutual')
  const [hasPlusOne, setHasPlusOne] = useState(false)
  const [plusOneName, setPlusOneName] = useState('')
  const [plusOneDietary, setPlusOneDietary] = useState('')
  const [dietary, setDietary] = useState<string[]>([])
  const [accommodation, setAccommodation] = useState(false)
  const [accommodationNotes, setAccommodationNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDietary(option: string) {
    setDietary(prev =>
      prev.includes(option) ? prev.filter(d => d !== option) : [...prev, option]
    )
  }

  function toggleEvent(eventId: string) {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: guest, error: gErr } = await supabase
      .from('guests')
      .insert({
        wedding_id: weddingId,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        side,
        has_plus_one: hasPlusOne,
        plus_one_name: hasPlusOne ? plusOneName.trim() || null : null,
        plus_one_dietary: hasPlusOne ? plusOneDietary.trim() || null : null,
        dietary,
        accommodation,
        accommodation_notes: accommodation ? accommodationNotes.trim() || null : null,
        notes: notes.trim() || null,
      })
      .select('id')
      .single()

    if (gErr) {
      setError(gErr.message)
      setLoading(false)
      return
    }

    if (selectedEvents.length > 0) {
      await supabase.from('guest_events').insert(
        selectedEvents.map(eventId => ({
          guest_id: guest.id,
          event_id: eventId,
          invited: true,
          rsvp_status: 'pending',
        }))
      )
    }

    onClose()
    router.refresh()
  }

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
  const labelCls = "text-xs font-medium text-gray-500"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Guest</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Name *</label>
            <input required className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@example.com" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Phone</label>
              <input type="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9…" />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Side</label>
            <div className="flex gap-2">
              {(['bride', 'groom', 'mutual'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    side === s
                      ? s === 'bride' ? 'bg-pink-100 border-pink-300 text-pink-700'
                        : s === 'groom' ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Dietary restrictions</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleDietary(opt)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    dietary.includes(opt)
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="plus-one"
              type="checkbox"
              checked={hasPlusOne}
              onChange={e => setHasPlusOne(e.target.checked)}
              className="rounded border-gray-300 text-purple-600"
            />
            <label htmlFor="plus-one" className="text-sm text-gray-700">Bringing a +1</label>
          </div>

          {hasPlusOne && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div className="space-y-1">
                <label className={labelCls}>+1 name</label>
                <input className={inputCls} value={plusOneName} onChange={e => setPlusOneName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>+1 dietary</label>
                <input className={inputCls} value={plusOneDietary} onChange={e => setPlusOneDietary(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="accommodation"
              type="checkbox"
              checked={accommodation}
              onChange={e => setAccommodation(e.target.checked)}
              className="rounded border-gray-300 text-purple-600"
            />
            <label htmlFor="accommodation" className="text-sm text-gray-700">Needs accommodation</label>
          </div>

          {accommodation && (
            <div className="pl-6 space-y-1">
              <label className={labelCls}>Accommodation notes</label>
              <input className={inputCls} value={accommodationNotes} onChange={e => setAccommodationNotes(e.target.value)} placeholder="Room type, dates…" />
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              <label className={labelCls}>Invite to events</label>
              <div className="space-y-1">
                {events.map(event => (
                  <label key={event.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{event.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything to remember…" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : 'Add Guest'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
