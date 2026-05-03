import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GuestListClient } from '@/components/guests/GuestListClient'

export default async function GuestsPage({
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
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const [{ data: guests }, { data: events }] = await Promise.all([
    supabase
      .from('guests')
      .select('id, name, email, phone, side, has_plus_one, plus_one_name, dietary, accommodation, notes, guest_events(event_id, rsvp_status)')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('events')
      .select('id, name')
      .eq('wedding_id', wedding.id)
      .order('date', { ascending: true }),
  ])

  return (
    <GuestListClient
      weddingId={wedding.id}
      guests={guests ?? []}
      events={events ?? []}
    />
  )
}
