import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsPageClient } from './EventsPageClient'
import type { Event, RsvpBreakdown } from '@/components/events/EventCard'

export default async function EventsPage({
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
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true, nullsFirst: false })

  const eventList: Event[] = events ?? []
  const eventIds = eventList.map(e => e.id)

  const guestCountMap: Record<string, number> = {}
  const rsvpMap: Record<string, RsvpBreakdown> = {}

  if (eventIds.length > 0) {
    const { data: geRows } = await supabase
      .from('guest_events')
      .select('event_id, rsvp_status')
      .in('event_id', eventIds)
      .eq('invited', true)

    for (const row of (geRows ?? [])) {
      if (!guestCountMap[row.event_id]) guestCountMap[row.event_id] = 0
      guestCountMap[row.event_id]++

      if (!rsvpMap[row.event_id]) rsvpMap[row.event_id] = { yes: 0, no: 0, pending: 0 }
      const status = row.rsvp_status as 'yes' | 'no' | 'pending'
      if (status in rsvpMap[row.event_id]) rsvpMap[row.event_id][status]++
    }
  }

  return (
    <EventsPageClient
      wedding={wedding}
      events={eventList}
      guestCountMap={guestCountMap}
      rsvpMap={rsvpMap}
    />
  )
}
