'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CategoryModal } from './CategoryModal'
import { BudgetItemModal } from './BudgetItemModal'

export interface BudgetItem {
  id: string
  wedding_id: string
  category_id: string
  vendor_id: string | null
  description: string
  estimated: number
  actual: number | null
  paid: boolean
}

export interface BudgetCategory {
  id: string
  wedding_id: string
  name: string
  allocated_amount: number
  budget_items: BudgetItem[]
}

interface BudgetClientProps {
  weddingId: string
  categories: BudgetCategory[]
}

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function SummaryStrip({ categories }: { categories: BudgetCategory[] }) {
  const totalAllocated = categories.reduce((s, c) => s + c.allocated_amount, 0)
  const totalEstimated = categories.reduce(
    (s, c) => s + c.budget_items.reduce((si, i) => si + i.estimated, 0), 0
  )
  const totalActual = categories.reduce(
    (s, c) => s + c.budget_items.reduce((si, i) => si + (i.actual ?? 0), 0), 0
  )
  const remaining = totalAllocated - totalActual

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total Allocated', value: totalAllocated },
        { label: 'Total Estimated', value: totalEstimated },
        { label: 'Total Actual', value: totalActual },
        { label: 'Remaining', value: remaining, highlight: remaining < 0 },
      ].map(({ label, value, highlight }) => (
        <div key={label} className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium">{label}</p>
          <p className={`text-lg font-bold mt-1 ${highlight ? 'text-red-500' : 'text-gray-900'}`}>
            {formatINR(value)}
          </p>
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ actual, allocated }: { actual: number; allocated: number }) {
  const pct = allocated > 0 ? Math.min((actual / allocated) * 100, 100) : 0
  const over = allocated > 0 && actual > allocated
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-purple-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function CategoryCard({
  category,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onTogglePaid,
}: {
  category: BudgetCategory
  onEditCategory: (c: BudgetCategory) => void
  onDeleteCategory: (id: string) => void
  onAddItem: (c: BudgetCategory) => void
  onEditItem: (item: BudgetItem, category: BudgetCategory) => void
  onDeleteItem: (id: string) => void
  onTogglePaid: (item: BudgetItem) => void
}) {
  const [open, setOpen] = useState(true)
  const actualSum = category.budget_items.reduce((s, i) => s + (i.actual ?? 0), 0)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{category.name}</span>
            <span className="text-xs text-gray-400">{formatINR(category.allocated_amount)} allocated</span>
          </div>
          <ProgressBar actual={actualSum} allocated={category.allocated_amount} />
          <p className="text-xs text-gray-400 mt-1">
            {formatINR(actualSum)} spent of {formatINR(category.allocated_amount)}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEditCategory(category) }}
            className="text-gray-400 hover:text-purple-600 text-xs px-2 py-1 rounded"
            title="Edit category"
          >
            Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDeleteCategory(category.id) }}
            className="text-gray-300 hover:text-red-400 text-xs px-2 py-1 rounded"
            title="Delete category"
          >
            ✕
          </button>
          <span className="text-gray-300 text-sm ml-1">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {category.budget_items.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No items yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {category.budget_items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={item.paid}
                    onChange={() => onTogglePaid(item)}
                    className="rounded border-gray-300 text-purple-600 cursor-pointer shrink-0"
                    title="Mark as paid"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 truncate ${item.paid ? 'line-through text-gray-400' : ''}`}>
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Est: {formatINR(item.estimated)}
                      {item.actual != null && (
                        <span className="ml-2 text-gray-600">Actual: {formatINR(item.actual)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditItem(item, category)}
                      className="text-gray-400 hover:text-purple-600 text-xs px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-gray-300 hover:text-red-400 text-xs px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-3 border-t border-gray-50">
            <button
              onClick={() => onAddItem(category)}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              + Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BudgetClient({ weddingId, categories }: BudgetClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [addingItemToCategory, setAddingItemToCategory] = useState<BudgetCategory | null>(null)
  const [editingItem, setEditingItem] = useState<{ item: BudgetItem; category: BudgetCategory } | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category and all its items?')) return
    await supabase.from('budget_categories').delete().eq('id', id)
    refresh()
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    await supabase.from('budget_items').delete().eq('id', id)
    refresh()
  }

  async function handleTogglePaid(item: BudgetItem) {
    await supabase.from('budget_items').update({ paid: !item.paid }).eq('id', item.id)
    refresh()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} categories</p>
        </div>
        <Button
          onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          + Add Category
        </Button>
      </div>

      <SummaryStrip categories={categories} />

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-400">No budget categories yet. Add your first category!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEditCategory={c => { setEditingCategory(c); setShowCategoryModal(true) }}
              onDeleteCategory={handleDeleteCategory}
              onAddItem={c => { setAddingItemToCategory(c); setEditingItem(null) }}
              onEditItem={(item, cat) => { setEditingItem({ item, category: cat }); setAddingItemToCategory(null) }}
              onDeleteItem={handleDeleteItem}
              onTogglePaid={handleTogglePaid}
            />
          ))}
        </div>
      )}

      {showCategoryModal && (
        <CategoryModal
          weddingId={weddingId}
          category={editingCategory ?? undefined}
          onClose={() => setShowCategoryModal(false)}
          onSaved={() => { setShowCategoryModal(false); refresh() }}
        />
      )}

      {(addingItemToCategory || editingItem) && (
        <BudgetItemModal
          weddingId={weddingId}
          categoryId={(addingItemToCategory ?? editingItem!.category).id}
          item={editingItem?.item}
          onClose={() => { setAddingItemToCategory(null); setEditingItem(null) }}
          onSaved={() => { setAddingItemToCategory(null); setEditingItem(null); refresh() }}
        />
      )}
    </div>
  )
}
