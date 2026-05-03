'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { InvitationContact } from './InvitationsClient'

interface Props {
  cardId: string
  contact: InvitationContact | null
  onClose: () => void
}

export function ContactModal({ cardId, contact, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [label, setLabel] = useState(contact?.label ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [isPrimary, setIsPrimary] = useState(contact?.is_primary ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim() && !email.trim()) {
      setError('Enter at least a phone number or email.')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      label: label.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      is_primary: isPrimary,
    }

    const { error: err } = contact
      ? await supabase.from('invitation_contacts').update(payload).eq('id', contact.id)
      : await supabase.from('invitation_contacts').insert({ ...payload, card_id: cardId })

    if (err) { setError(err.message); setLoading(false); return }
    onClose()
    router.refresh()
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
  const labelCls = 'text-xs font-medium text-gray-500'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Label (optional)</label>
            <input className={inputCls} value={label} onChange={e => setLabel(e.target.value)}
              placeholder="Dad, Mom, Rahul bhai…" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Phone</label>
            <input type="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)}
              className="rounded border-gray-300 text-purple-600" />
            <span className="text-sm text-gray-600">Primary contact for this family</span>
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : contact ? 'Save changes' : 'Add Contact'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
