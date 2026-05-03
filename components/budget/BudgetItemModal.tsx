'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { BudgetItem } from './BudgetClient'

interface BudgetItemModalProps {
  weddingId: string
  categoryId: string
  item?: BudgetItem
  onClose: () => void
  onSaved: () => void
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
const labelCls = "text-xs font-medium text-gray-500"

export function BudgetItemModal({ weddingId, categoryId, item, onClose, onSaved }: BudgetItemModalProps) {
  const supabase = createClient()
  const [description, setDescription] = useState(item?.description ?? '')
  const [estimated, setEstimated] = useState(String(item?.estimated ?? ''))
  const [actual, setActual] = useState(item?.actual != null ? String(item.actual) : '')
  const [paid, setPaid] = useState(item?.paid ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = Boolean(item)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setLoading(true)
    setError(null)

    const payload = {
      wedding_id: weddingId,
      category_id: categoryId,
      description: description.trim(),
      estimated: parseFloat(estimated) || 0,
      actual: actual !== '' ? parseFloat(actual) : null,
      paid,
    }

    const { error: err } = isEdit
      ? await supabase.from('budget_items').update(payload).eq('id', item!.id)
      : await supabase.from('budget_items').insert(payload)

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
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Item' : 'Add Budget Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Description *</label>
            <input
              required
              className={inputCls}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Mehendi stage backdrop…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Estimated (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={estimated}
                onChange={e => setEstimated(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Actual (₹, optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={actual}
                onChange={e => setActual(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paid"
              checked={paid}
              onChange={e => setPaid(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 cursor-pointer"
            />
            <label htmlFor="paid" className="text-sm text-gray-700 cursor-pointer">Marked as paid</label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
