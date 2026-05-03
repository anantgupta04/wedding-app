import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Mock supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: () => Promise.resolve({ error: null }),
    }),
  }),
}))

import { formatINR, BudgetClient } from '@/components/budget/BudgetClient'
import type { BudgetCategory } from '@/components/budget/BudgetClient'

// ---------------------------------------------------------------------------
// 1. formatINR utility
// ---------------------------------------------------------------------------
describe('formatINR', () => {
  it('formats 100000 as ₹1,00,000', () => {
    expect(formatINR(100000)).toBe('₹1,00,000')
  })

  it('formats 0 as ₹0', () => {
    expect(formatINR(0)).toBe('₹0')
  })

  it('formats 1500.5 as ₹1,500.50', () => {
    expect(formatINR(1500.5)).toBe('₹1,500.50')
  })
})

// ---------------------------------------------------------------------------
// 2. Summary calculations
// ---------------------------------------------------------------------------
const mockCategories: BudgetCategory[] = [
  {
    id: 'cat-1',
    wedding_id: 'w-1',
    name: 'Catering',
    allocated_amount: 200000,
    budget_items: [
      { id: 'i-1', wedding_id: 'w-1', category_id: 'cat-1', vendor_id: null, description: 'Food', estimated: 150000, actual: 140000, paid: true },
      { id: 'i-2', wedding_id: 'w-1', category_id: 'cat-1', vendor_id: null, description: 'Drinks', estimated: 30000, actual: null, paid: false },
    ],
  },
  {
    id: 'cat-2',
    wedding_id: 'w-1',
    name: 'Decor',
    allocated_amount: 80000,
    budget_items: [
      { id: 'i-3', wedding_id: 'w-1', category_id: 'cat-2', vendor_id: null, description: 'Flowers', estimated: 50000, actual: 55000, paid: false },
    ],
  },
]

describe('Summary calculations', () => {
  it('computes total allocated correctly', () => {
    const totalAllocated = mockCategories.reduce((s, c) => s + c.allocated_amount, 0)
    expect(totalAllocated).toBe(280000)
  })

  it('computes total estimated correctly', () => {
    const totalEstimated = mockCategories.reduce(
      (s, c) => s + c.budget_items.reduce((si, i) => si + i.estimated, 0), 0
    )
    expect(totalEstimated).toBe(230000)
  })

  it('computes total actual correctly (null items treated as 0)', () => {
    const totalActual = mockCategories.reduce(
      (s, c) => s + c.budget_items.reduce((si, i) => si + (i.actual ?? 0), 0), 0
    )
    expect(totalActual).toBe(195000)
  })

  it('computes remaining as allocated minus actual', () => {
    const totalAllocated = mockCategories.reduce((s, c) => s + c.allocated_amount, 0)
    const totalActual = mockCategories.reduce(
      (s, c) => s + c.budget_items.reduce((si, i) => si + (i.actual ?? 0), 0), 0
    )
    expect(totalAllocated - totalActual).toBe(85000)
  })
})

// ---------------------------------------------------------------------------
// 3. BudgetClient renders empty state
// ---------------------------------------------------------------------------
describe('BudgetClient', () => {
  it('renders empty state when no categories', () => {
    render(<BudgetClient weddingId="w-1" categories={[]} />)
    expect(screen.getByText(/no budget categories yet/i)).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // 4. BudgetClient renders category names and item descriptions
  // -------------------------------------------------------------------------
  it('renders category names when given mock data', () => {
    render(<BudgetClient weddingId="w-1" categories={mockCategories} />)
    expect(screen.getByText('Catering')).toBeTruthy()
    expect(screen.getByText('Decor')).toBeTruthy()
  })

  it('renders item descriptions when given mock data', () => {
    render(<BudgetClient weddingId="w-1" categories={mockCategories} />)
    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText('Drinks')).toBeTruthy()
    expect(screen.getByText('Flowers')).toBeTruthy()
  })
})
