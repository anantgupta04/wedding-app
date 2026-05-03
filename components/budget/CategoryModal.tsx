'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { BudgetCategory } from './BudgetClient'

interface CategoryModalProps {
  weddingId: string
  category?: BudgetCategory
  onClose: () => void
  onSaved: () => void
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
const labelCls = "text-xs font-medium text-gray-500"

export function CategoryModal({ weddingId, category, onClose, onSaved }: CategoryModalProps) {
  const supabase = createClient()
  const [name, setName] = useState(category?.name ?? '')
  const [allocated, setAllocated] = useState(String(category?.allocated_amount ?? ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = Boolean(category)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const payload = {
      wedding_id: weddingId,
      name: name.trim(),
      allocated_amount: parseFloat(allocated) || 0,
    }

    const { error: err } = isEdit
      ? await supabase.from('budget_categories').update(payload).eq('id', category!.id)
      : await supabase.from('budget_categories').insert(payload)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Category name *</label>
            <input
              required
              className={inputCls}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Catering, Decor, Photography…"
            />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Allocated amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={allocated}
              onChange={e => setAllocated(e.target.value)}
              placeholder="0"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Category'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
