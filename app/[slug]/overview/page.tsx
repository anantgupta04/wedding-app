import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingChecklist } from '@/components/OnboardingChecklist'

function countdown(dateStr: string | null): string {
  if (!dateStr) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const wedding = new Date(dateStr)
  wedding.setHours(0, 0, 0, 0)
  const diff = Math.round((wedding.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Today is the day!"
  if (diff < 0) return `${Math.abs(diff)} days ago`
  return `${diff} days to go`
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, name, date, currency')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalGuests },
    { data: rsvpBreakdown },
    { data: overdueTasks },
    { count: eventCount },
    { data: inviteConfig },
    { count: memberCount },
  ] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id),
    supabase
      .from('guest_events')
      .select('rsvp_status, guests!inner(wedding_id)')
      .eq('guests.wedding_id', wedding.id),
    supabase
      .from('tasks')
      .select('id, title, due_date, priority, status')
      .eq('wedding_id', wedding.id)
      .lt('due_date', today)
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id),
    supabase.from('invite_config').select('published').eq('wedding_id', wedding.id).single(),
    supabase.from('wedding_members').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id),
  ])

  const hasEvents = (eventCount ?? 0) > 0
  const hasGuests = (totalGuests ?? 0) >= 5
  const hasInvitePublished = inviteConfig?.published === true
  const hasTeammates = (memberCount ?? 0) > 1
  const showChecklist = !(hasEvents && hasGuests && hasInvitePublished && hasTeammates)

  const confirmed = (rsvpBreakdown ?? []).filter(r => r.rsvp_status === 'yes').length
  const declined = (rsvpBreakdown ?? []).filter(r => r.rsvp_status === 'no').length
  const pending = (rsvpBreakdown ?? []).filter(r => r.rsvp_status === 'pending').length

  const countdownText = countdown(wedding.date)

  const priorityColor: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Onboarding checklist */}
      {showChecklist && (
        <OnboardingChecklist
          weddingId={wedding.id}
          slug={slug}
          hasEvents={hasEvents}
          hasGuests={hasGuests}
          hasInvitePublished={hasInvitePublished}
          hasTeammates={hasTeammates}
        />
      )}

      {/* Countdown banner */}
      {wedding.date && (
        <div className="bg-purple-600 text-white rounded-2xl p-6 text-center">
          <p className="text-sm font-medium opacity-80">{wedding.name}</p>
          <p className="text-4xl font-bold mt-1">{countdownText}</p>
          <p className="text-sm opacity-70 mt-1">
            {new Date(wedding.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirmed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{confirmed}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pending</p>
          <p className="text-3xl font-bold text-yellow-500 mt-1">{pending}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Declined</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{declined}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Guests</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{totalGuests ?? 0}</p>
        </div>
      </div>

      {/* Overdue tasks */}
      {(overdueTasks ?? []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-red-600 mb-4">Overdue Tasks</h2>
          <ul className="space-y-3">
            {(overdueTasks ?? []).map(task => (
              <li key={task.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="text-sm text-gray-800 truncate">{task.title}</span>
                </div>
                <span className="text-xs text-red-500 shrink-0">
                  {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(overdueTasks ?? []).length === 0 && (totalGuests ?? 0) === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-2">
          <p className="text-gray-500">Welcome! Start by adding your events and guests.</p>
        </div>
      )}
    </div>
  )
}
