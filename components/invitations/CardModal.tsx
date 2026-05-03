'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { InvitationCard } from './InvitationsClient'

interface Props {
  weddingId: string
  card: InvitationCard | null
  onClose: () => void
}

export function CardModal({ weddingId, card, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [familyName, setFamilyName] = useState(card?.family_name ?? '')
  const [side, setSide] = useState<'groom' | 'bride' | 'both'>(card?.side ?? 'groom')
  const [estimatedCount, setEstimatedCount] = useState(String(card?.estimated_count ?? 1))
  const [status, setStatus] = useState(card?.status ?? 'not_contacted')
  const [notes, setNotes] = useState(card?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim()) return
    setLoading(true)
    setError(null)

    const payload = {
      family_name: familyName.trim(),
      side,
      estimated_count: parseInt(estimatedCount) || 1,
      status,
      notes: notes.trim() || null,
    }

    const { error: err } = card
      ? await supabase.from('invitation_cards').update(payload).eq('id', card.id)
      : await supabase.from('invitation_cards').insert({ ...payload, wedding_id: weddingId })

    if (err) { setError(err.message); setLoading(false); return }
    onClose()
    router.refresh()
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
  const labelCls = 'text-xs font-medium text-gray-500'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{card ? 'Edit Family' : 'Add Family'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Family / Person name *</label>
            <input required className={inputCls} value={familyName}
              onChange={e => setFamilyName(e.target.value)} placeholder="Sharma Family" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Side</label>
            <div className="flex gap-2">
              {(['groom', 'bride', 'both'] as const).map(s => (
                <button key={s} type="button" onClick={() => setSide(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    side === s
                      ? s === 'groom' ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : s === 'bride' ? 'bg-pink-100 border-pink-300 text-pink-700'
                        : 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Estimated guests</label>
              <input type="number" min="1" className={inputCls} value={estimatedCount}
                onChange={e => setEstimatedCount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as typeof status)}>
                <option value="not_contacted">Not Contacted</option>
                <option value="called">Called</option>
                <option value="invite_sent">Invite Sent</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Close friends, need physical invite, etc." />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : card ? 'Save changes' : 'Add Family'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
