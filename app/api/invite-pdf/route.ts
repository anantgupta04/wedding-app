import { type NextRequest } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { createServiceClient } from '@/lib/supabase/service'
import React from 'react'

Font.register({
  family: 'NotoSansDevanagari',
  src: 'https://fonts.gstatic.com/s/notosansdevanagari/v25/TuGUUVJ3RomyDGKuYZbe6D6UgRTxqA.woff2',
})
Font.register({
  family: 'PlayfairDisplay',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzD.woff2',
})

const styles = StyleSheet.create({
  page: { padding: 60, backgroundColor: '#FDF8F0', fontFamily: 'PlayfairDisplay' },
  coupleNames: { fontSize: 36, color: '#8B1A1A', textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 14, color: '#C9A84C', textAlign: 'center', fontStyle: 'italic', marginBottom: 24 },
  divider: { borderBottomWidth: 1, borderColor: '#C9A84C', marginVertical: 20 },
  sectionTitle: { fontSize: 16, color: '#8B1A1A', marginBottom: 12 },
  eventName: { fontSize: 14, fontWeight: 'bold', color: '#2C1810' },
  eventDetail: { fontSize: 11, color: '#666', marginBottom: 4 },
  rsvpText: { fontSize: 12, color: '#8B1A1A', textAlign: 'center', marginTop: 24 },
})

interface WeddingEvent {
  id: string
  name: string
  date: string | null
  time: string | null
  venue: string | null
}

interface InviteData {
  coupleNames: string
  tagline: string
  events: WeddingEvent[]
  slug: string
}

function formatEventDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function InvitePDF({ coupleNames, tagline, events, slug }: InviteData) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.coupleNames }, coupleNames),
      React.createElement(Text, { style: styles.tagline }, tagline),
      React.createElement(View, { style: styles.divider }),
      React.createElement(
        Text,
        { style: { fontSize: 13, color: '#2C1810', textAlign: 'center', marginBottom: 20 } },
        'Together with their families, invite you to celebrate'
      ),
      events.length > 0 &&
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.sectionTitle }, 'Events'),
          ...events.map(ev =>
            React.createElement(
              View,
              { key: ev.id, style: { marginBottom: 12 } },
              React.createElement(Text, { style: styles.eventName }, ev.name),
              ev.date && React.createElement(Text, { style: styles.eventDetail }, formatEventDate(ev.date)),
              ev.time && React.createElement(Text, { style: styles.eventDetail }, ev.time),
              ev.venue && React.createElement(Text, { style: styles.eventDetail }, ev.venue)
            )
          )
        ),
      React.createElement(View, { style: styles.divider }),
      React.createElement(
        Text,
        { style: styles.rsvpText },
        `Kindly RSVP at: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://shaadiapp.vercel.app'}/i/${slug}`
      ),
      React.createElement(
        Text,
        { style: { fontSize: 12, color: '#C9A84C', textAlign: 'center', marginTop: 32, fontStyle: 'italic' } },
        'With love'
      )
    )
  )
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return new Response('Missing slug', { status: 400 })
  }

  const service = createServiceClient()

  const { data: wedding } = await service
    .from('weddings')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!wedding) {
    return new Response('Wedding not found', { status: 404 })
  }

  const [{ data: inviteConfig }, { data: events }] = await Promise.all([
    service
      .from('invite_config')
      .select('couple_names, tagline')
      .eq('wedding_id', wedding.id)
      .single(),
    service
      .from('events')
      .select('id, name, date, time, venue')
      .eq('wedding_id', wedding.id)
      .order('date', { ascending: true }),
  ])

  const coupleNames = inviteConfig?.couple_names ?? wedding.name
  const tagline = inviteConfig?.tagline ?? 'Together we begin forever'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    InvitePDF({ coupleNames, tagline, events: (events ?? []) as WeddingEvent[], slug }) as any
  )

  // Buffer → ArrayBuffer for the Response BodyInit
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invite-${slug}.pdf"`,
    },
  })
}
