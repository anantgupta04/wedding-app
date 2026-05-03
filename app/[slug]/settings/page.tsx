import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage({
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
    .select('id, name, date, currency, slug')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const { data: membership } = await supabase
    .from('wedding_members')
    .select('role')
    .eq('wedding_id', wedding.id)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Only admins can manage settings.</p>
      </div>
    )
  }

  const { data: members } = await supabase
    .from('wedding_members')
    .select('id, user_id, role')
    .eq('wedding_id', wedding.id)
    .order('joined_at', { ascending: true })

  // Fetch profiles for all members so we can show names instead of UUIDs
  const memberIds = (members ?? []).map(m => m.user_id)
  const { data: profiles } = memberIds.length
    ? await supabase.from('profiles').select('user_id, display_name, email').in('user_id', memberIds)
    : { data: [] }

  const profileMap = Object.fromEntries(
    (profiles ?? []).map(p => [p.user_id, { displayName: p.display_name, email: p.email }])
  )

  const enrichedMembers = (members ?? []).map(m => ({
    ...m,
    displayName: profileMap[m.user_id]?.displayName ?? null,
    email: profileMap[m.user_id]?.email ?? null,
  }))

  return (
    <SettingsClient
      wedding={wedding}
      members={enrichedMembers}
      currentUserId={user.id}
    />
  )
}
