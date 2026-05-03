'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Wedding {
  id: string
  slug: string
  name: string
}

interface TopNavProps {
  currentSlug: string
  currentWeddingName: string
  allWeddings: Wedding[]
}

export function TopNav({ currentSlug, currentWeddingName, allWeddings }: TopNavProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleWeddingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value
    if (slug !== currentSlug) router.push(`/${slug}/overview`)
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-bold text-purple-600 shrink-0">
          Shaadi Planner
        </Link>

        {allWeddings.length > 1 ? (
          <select
            value={currentSlug}
            onChange={handleWeddingChange}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-[180px] truncate"
          >
            {allWeddings.map(w => (
              <option key={w.id} value={w.slug}>{w.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
            {currentWeddingName}
          </span>
        )}

        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-800 shrink-0"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
