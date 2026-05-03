'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface AddEventModalProps {
  weddingId: string
  onClose: () => void
}

interface FormState {
  name: string
  date: string
  time: string
  venue: string
  venue_map_url: string
  dress_code: string
  notes: string
}

const EMPTY: FormState = { name: '', date: '', time: '', venue: '', venue_map_url: '', dress_code: '', notes: '' }

export function AddEventModal({ weddingId, onClose }: AddEventModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('events').insert({
      wedding_id: weddingId,
      name: form.name.trim(),
      date: form.date || null,
      time: form.time || null,
      venue: form.venue.trim() || null,
      venue_map_url: form.venue_map_url.trim() || null,
      dress_code: form.dress_code.trim() || null,
      notes: form.notes.trim() || null,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
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
          <h2 className="text-lg font-semibold">Add Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className={labelCls}>Event name *</label>
            <input required className={inputCls} value={form.name} onChange={set('name')}
              placeholder="Mehendi, Sangam, Wedding…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={set('date')} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Time</label>
              <input type="time" className={inputCls} value={form.time} onChange={set('time')} />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Venue</label>
            <input className={inputCls} value={form.venue} onChange={set('venue')} placeholder="Leela Palace, Mumbai" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Venue map link</label>
            <input className={inputCls} value={form.venue_map_url} onChange={set('venue_map_url')}
              placeholder="https://maps.google.com/…" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Dress code</label>
            <input className={inputCls} value={form.dress_code} onChange={set('dress_code')}
              placeholder="Indian formal, Pastel tones…" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={3} value={form.notes} onChange={set('notes')}
              placeholder="Additional details…" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : 'Add Event'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
