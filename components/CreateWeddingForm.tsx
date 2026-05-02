'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export function CreateWeddingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [slug, setSlug] = useState('')
  const [showSlug, setShowSlug] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!showSlug) setSlug(toSlug(val))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const finalSlug = slug || toSlug(name)

    // Create wedding + add creator as admin in a transaction
    const { data: wedding, error: wErr } = await supabase
      .from('weddings')
      .insert({ name, slug: finalSlug, date: date || null, created_by: userId })
      .select('id, slug')
      .single()

    if (wErr) {
      setError(wErr.message.includes('unique') ? 'That URL is already taken. Try a different name.' : wErr.message)
      setLoading(false)
      return
    }

    await supabase.from('wedding_members').insert({
      wedding_id: wedding.id,
      user_id: userId,
      role: 'admin',
    })

    router.push(`/${wedding.slug}/overview`)
    router.refresh()
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full">
        + Create new wedding
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-purple-50 rounded-xl p-4">
      <h3 className="font-semibold text-sm">New Wedding</h3>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Couple names</label>
        <input
          required
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          placeholder="Anant & Priya"
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Wedding date (optional)</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Advanced: custom slug */}
      <button
        type="button"
        onClick={() => setShowSlug(!showSlug)}
        className="text-xs text-muted-foreground underline"
      >
        {showSlug ? 'Hide' : 'Customize'} URL
      </button>
      {showSlug && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            URL: shaadi.app/<span className="text-purple-600">{slug}</span>
          </label>
          <input
            value={slug}
            onChange={e => setSlug(toSlug(e.target.value))}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Creating…' : 'Create'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
