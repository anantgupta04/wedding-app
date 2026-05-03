import { createServiceClient } from '@/lib/supabase/service'
import InvitePageClient from '@/components/invite/InvitePageClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Wedding {
  id: string
  slug: string
  name: string
  date: string | null
}

interface InviteConfig {
  couple_names: string | null
  tagline: string | null
  story_text: string | null
  theme_color: string | null
  cover_image_url: string | null
  gallery_image_urls: string[] | null
  music_url: string | null
  published: boolean
}

interface WeddingEvent {
  id: string
  name: string
  date: string | null
  time: string | null
  venue: string | null
  venue_map_url: string | null
  dress_code: string | null
}

function ComingSoonPage({ name }: { name: string | null }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDF8F0',
        fontFamily: 'var(--font-playfair), Georgia, serif',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <svg viewBox="0 0 200 20" style={{ width: '8rem', margin: '0 auto 2rem', opacity: 0.6 }}>
        <path
          d="M0,10 Q25,0 50,10 Q75,20 100,10 Q125,0 150,10 Q175,20 200,10"
          stroke="#C9A84C"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="100" cy="10" r="3" fill="#C9A84C" />
      </svg>
      {name && (
        <h1 style={{ color: '#8B1A1A', fontSize: '2rem', marginBottom: '1rem' }}>{name}</h1>
      )}
      <p style={{ color: '#2C1810', fontSize: '1.125rem', fontStyle: 'italic', maxWidth: '32rem' }}>
        The invitation will be shared soon.
      </p>
      <svg viewBox="0 0 200 20" style={{ width: '8rem', margin: '2rem auto 0', opacity: 0.6 }}>
        <path
          d="M0,10 Q25,0 50,10 Q75,20 100,10 Q125,0 150,10 Q175,20 200,10"
          stroke="#C9A84C"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="100" cy="10" r="3" fill="#C9A84C" />
      </svg>
    </main>
  )
}

export default async function InvitePage({ params }: PageProps) {
  const { slug } = await params
  const service = createServiceClient()

  const { data: wedding } = await service
    .from('weddings')
    .select('id, slug, name, date')
    .eq('slug', slug)
    .single<Wedding>()

  if (!wedding) {
    return <ComingSoonPage name={null} />
  }

  const { data: invite } = await service
    .from('invite_config')
    .select(
      'couple_names, tagline, story_text, theme_color, cover_image_url, gallery_image_urls, music_url, published'
    )
    .eq('wedding_id', wedding.id)
    .single<InviteConfig>()

  if (!invite?.published) {
    return <ComingSoonPage name={wedding.name} />
  }

  const { data: events } = await service
    .from('events')
    .select('id, name, date, time, venue, venue_map_url, dress_code')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true })

  return (
    <InvitePageClient
      weddingId={wedding.id}
      weddingDate={wedding.date}
      slug={slug}
      invite={invite}
      events={(events as WeddingEvent[]) ?? []}
    />
  )
}
