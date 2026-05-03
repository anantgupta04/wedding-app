'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export interface OnboardingChecklistProps {
  weddingId: string
  slug: string
  hasEvents: boolean
  hasGuests: boolean
  hasInvitePublished: boolean
  hasTeammates: boolean
}

interface ChecklistItem {
  label: string
  href: string
  done: boolean
  newTab?: boolean
}

function storageKey(weddingId: string) {
  return `wedding-${weddingId}-onboarding`
}

export function OnboardingChecklist({
  weddingId,
  slug,
  hasEvents,
  hasGuests,
  hasInvitePublished,
  hasTeammates,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey(weddingId))
      if (stored) setDismissed(true)
    }
  }, [weddingId])

  function dismiss() {
    localStorage.setItem(storageKey(weddingId), 'true')
    setDismissed(true)
  }

  if (!mounted || dismissed) return null

  const items: ChecklistItem[] = [
    { label: 'Add your first event', href: `/${slug}/events`, done: hasEvents },
    { label: 'Add 5 guests', href: `/${slug}/guests`, done: hasGuests },
    { label: 'Preview your invite', href: `/i/${slug}`, done: hasInvitePublished, newTab: true },
    { label: 'Invite a teammate', href: `/${slug}/settings`, done: hasTeammates },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Get started</h2>
        <button
          onClick={dismiss}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Got it, dismiss
        </button>
      </div>
      <ul className="space-y-3">
        {items.map(item => (
          <li key={item.href} className="flex items-center gap-3">
            <span
              className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                item.done
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {item.done ? '✓' : '○'}
            </span>
            <Link
              href={item.href}
              target={item.newTab ? '_blank' : undefined}
              rel={item.newTab ? 'noopener noreferrer' : undefined}
              className={`text-sm ${
                item.done
                  ? 'text-gray-400 line-through'
                  : 'text-purple-600 hover:text-purple-800 hover:underline'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
