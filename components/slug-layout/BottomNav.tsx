'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, CheckSquare, Send, Settings } from 'lucide-react'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, href: 'overview' },
  { label: 'Events', icon: CalendarDays, href: 'events' },
  { label: 'Guests', icon: Users, href: 'guests' },
  { label: 'Tasks', icon: CheckSquare, href: 'tasks' },
  { label: 'Invites', icon: Send, href: 'invitations' },
  { label: 'Settings', icon: Settings, href: 'settings' },
]

export function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-5xl mx-auto flex">
        {navItems.map(({ label, icon: Icon, href }) => {
          const fullPath = `/${slug}/${href}`
          const isActive = pathname === fullPath || pathname.startsWith(`${fullPath}/`)
          return (
            <Link
              key={href}
              href={fullPath}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`size-5 ${isActive ? 'text-purple-600' : ''}`} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
