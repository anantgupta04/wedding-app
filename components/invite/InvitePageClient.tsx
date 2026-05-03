'use client'

import { motion } from 'framer-motion'
import CountdownTimer from './CountdownTimer'
import { RsvpForm } from './RsvpForm'

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface InvitePageClientProps {
  weddingId: string
  weddingDate: string | null
  slug: string
  invite: InviteConfig
  events: WeddingEvent[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ORDINAL_SUFFIXES = ['th', 'st', 'nd', 'rd']

function ordinal(n: number): string {
  const v = n % 100
  const suffix = ORDINAL_SUFFIXES[(v - 20) % 10] ?? ORDINAL_SUFFIXES[v] ?? ORDINAL_SUFFIXES[0]
  return `${n}${suffix}`
}

function formatElegantDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  const day = d.getUTCDate()
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
  const year = d.getUTCFullYear()
  return `${dayName}, the ${ordinal(day)} of ${month}, ${year}`
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

function RevealSection({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const animProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
      }
  return (
    <motion.div {...animProps} style={style}>
      {children}
    </motion.div>
  )
}

function BotanicalDivider() {
  return (
    <svg viewBox="0 0 200 20" style={{ width: '8rem', display: 'block', margin: '2rem auto', opacity: 0.6 }}>
      <path
        d="M0,10 Q25,0 50,10 Q75,20 100,10 Q125,0 150,10 Q175,20 200,10"
        stroke="#C9A84C"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="100" cy="10" r="3" fill="#C9A84C" />
    </svg>
  )
}

function EventCard({ event }: { event: WeddingEvent }) {
  return (
    <div
      style={{
        backgroundColor: '#FDF8F0',
        border: '1px solid #C9A84C',
        borderRadius: '0.5rem',
        padding: '1.5rem 2rem',
        maxWidth: '32rem',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h3 style={{ color: '#8B1A1A', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        {event.name}
      </h3>
      {event.date && (
        <p style={{ color: '#2C1810', marginBottom: '0.25rem' }}>{formatEventDate(event.date)}</p>
      )}
      {event.time && (
        <p style={{ color: '#2C1810', marginBottom: '0.25rem' }}>{event.time}</p>
      )}
      {event.venue && (
        <p style={{ color: '#2C1810', marginBottom: '0.25rem' }}>
          {event.venue_map_url ? (
            <a
              href={event.venue_map_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#C9A84C', textDecoration: 'underline' }}
            >
              {event.venue}
            </a>
          ) : (
            event.venue
          )}
        </p>
      )}
      {event.dress_code && (
        <p style={{ color: '#6B4226', fontSize: '0.875rem', fontStyle: 'italic', marginTop: '0.5rem' }}>
          Dress code: {event.dress_code}
        </p>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function InvitePageClient({
  weddingId,
  weddingDate,
  slug,
  invite,
  events,
}: InvitePageClientProps) {
  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : `https://shaadiplanner.app/i/${slug}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('You are invited! ' + shareUrl)}`
  const elegantDate = formatElegantDate(weddingDate)
  const storyParagraphs = invite.story_text ? invite.story_text.split('\n\n') : []

  return (
    <main style={{ fontFamily: 'var(--font-playfair), Georgia, serif', color: '#2C1810' }}>
      {/* 1. Cover Section */}
      <RevealSection
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8B1A1A 0%, #5C1010 100%)',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
      >
        {invite.couple_names && (
          <h1
            style={{
              color: '#C9A84C',
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: 700,
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}
          >
            {invite.couple_names}
          </h1>
        )}
        {invite.tagline && (
          <p
            style={{
              color: '#F5E6D3',
              fontSize: '1.25rem',
              fontStyle: 'italic',
              marginBottom: '1.5rem',
            }}
          >
            {invite.tagline}
          </p>
        )}
        {elegantDate && (
          <p style={{ color: '#F5E6D3', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            {elegantDate}
          </p>
        )}
        <CountdownTimer weddingDate={weddingDate} />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: '2rem',
            display: 'inline-block',
            backgroundColor: '#25D366',
            color: '#fff',
            padding: '0.625rem 1.5rem',
            borderRadius: '9999px',
            fontSize: '0.9375rem',
            textDecoration: 'none',
            fontFamily: 'var(--font-playfair), Georgia, serif',
          }}
        >
          Share on WhatsApp
        </a>
      </RevealSection>

      {/* 2. Divider */}
      <BotanicalDivider />

      {/* 3. Events Section */}
      {events.length > 0 && (
        <RevealSection
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            backgroundColor: '#F5E6D3',
          }}
        >
          <h2
            style={{
              color: '#8B1A1A',
              fontSize: '2rem',
              marginBottom: '2rem',
            }}
          >
            Join Us For
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </RevealSection>
      )}

      {/* 4. Divider */}
      <BotanicalDivider />

      {/* 5. Story Section */}
      {storyParagraphs.length > 0 && (
        <RevealSection
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            backgroundColor: '#FDF8F0',
          }}
        >
          <h2 style={{ color: '#8B1A1A', fontSize: '2rem', marginBottom: '1.5rem' }}>
            Our Journey
          </h2>
          <div
            style={{
              maxWidth: '65ch',
              margin: '0 auto',
              fontStyle: 'italic',
              lineHeight: 1.8,
              color: '#2C1810',
            }}
          >
            {storyParagraphs.map((para, i) => (
              <p key={i} style={{ marginBottom: '1rem' }}>
                {para}
              </p>
            ))}
          </div>
        </RevealSection>
      )}

      {/* 6. Divider */}
      <BotanicalDivider />

      {/* 7. RSVP Section */}
      <RevealSection
        style={{
          padding: '2rem 1.5rem',
          textAlign: 'center',
          backgroundColor: '#F5E6D3',
        }}
      >
        <h2 style={{ color: '#8B1A1A', fontSize: '2rem', marginBottom: '1.5rem' }}>
          Kindly Reply
        </h2>
        <RsvpForm weddingId={weddingId} events={events} slug={slug} />
      </RevealSection>

      {/* 8. Footer */}
      <footer
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: '#2C1810',
          color: '#C9A84C',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        }}
      >
        Made with Shaadi Planner
      </footer>
    </main>
  )
}
