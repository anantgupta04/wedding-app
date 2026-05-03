import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskListClient } from '@/components/tasks/TaskListClient'

export default async function TasksPage({
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
    .select('id')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: tasks }, { data: events }, { data: members }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, description, priority, status, due_date, event_id, assigned_to')
      .eq('wedding_id', wedding.id)
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('events')
      .select('id, name')
      .eq('wedding_id', wedding.id)
      .order('date', { ascending: true }),
    supabase
      .from('wedding_members')
      .select('user_id')
      .eq('wedding_id', wedding.id),
  ])

  const memberIds = (members ?? []).map(m => m.user_id)
  const { data: profiles } = memberIds.length > 0
    ? await supabase.from('profiles').select('user_id, display_name, email').in('user_id', memberIds)
    : { data: [] }

  const memberDisplayNames: Record<string, string> = {}
  for (const p of profiles ?? []) {
    memberDisplayNames[p.user_id] = p.display_name ?? p.email ?? p.user_id.slice(0, 8)
  }

  // Sort: overdue non-done tasks first, then by priority, then by due_date
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sorted = [...(tasks ?? [])].sort((a, b) => {
    const aOverdue = a.due_date && a.due_date < today && a.status !== 'done'
    const bOverdue = b.due_date && b.due_date < today && b.status !== 'done'
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    const pDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    if (pDiff !== 0) return pDiff
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  return (
    <TaskListClient
      weddingId={wedding.id}
      tasks={sorted}
      events={events ?? []}
      members={members ?? []}
      memberDisplayNames={memberDisplayNames}
      currentUserId={user.id}
    />
  )
}
