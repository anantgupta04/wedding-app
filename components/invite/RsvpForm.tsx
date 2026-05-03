'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Offline queue ────────────────────────────────────────────────────────────

interface RsvpPayload {
  name: string
  email: string | null
  phone: string | null
  attending: boolean
  dietary: string[]
  plus_one_name: string | null
  message: string | null
  eventIds: string[]
}

interface QueuedRsvp {
  weddingId: string
  payload: RsvpPayload
  timestamp: number
}

const QUEUE_KEY = 'rsvp_queue'

function readQueue(): QueuedRsvp[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeQueue(items: QueuedRsvp[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Event {
  id: string
  name: string
  date: string | null
  time: string | null
}

export interface RsvpFormProps {
  weddingId: string
  events: Event[]
  slug: string
}

type DietaryOption = 'Vegetarian' | 'Vegan' | 'Jain' | 'Halal' | 'No restrictions' | 'Other'

const DIETARY_OPTIONS: DietaryOption[] = [
  'Vegetarian',
  'Vegan',
  'Jain',
  'Halal',
  'No restrictions',
  'Other',
]

// ─── Design tokens ────────────────────────────────────────────────────────────

const RED = '#8B1A1A'
const GOLD = '#C9A84C'
const CREAM = '#FDF8F0'
const DARK = '#2C1810'

// ─── Small sub-components ────────────────────────────────────────────────────

interface PillProps {
  label: string
  selected: boolean
  onClick: () => void
  variant?: 'attendance' | 'toggle'
}

function Pill({ label, selected, onClick, variant = 'toggle' }: PillProps) {
  const base: React.CSSProperties = {
    padding: variant === 'attendance' ? '12px 28px' : '8px 20px',
    borderRadius: '9999px',
    border: `1.5px solid ${selected ? RED : GOLD}`,
    background: selected ? RED : CREAM,
    color: selected ? '#fff' : DARK,
    fontFamily: 'inherit',
    fontSize: variant === 'attendance' ? '1rem' : '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    letterSpacing: '0.01em',
  }
  return (
    <button type="button" style={base} onClick={onClick}>
      {label}
    </button>
  )
}

interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

function Chip({ label, selected, onClick }: ChipProps) {
  const style: React.CSSProperties = {
    padding: '6px 16px',
    borderRadius: '9999px',
    border: `1.5px solid ${GOLD}`,
    background: selected ? GOLD : CREAM,
    color: selected ? '#fff' : DARK,
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }
  return (
    <button type="button" style={style} onClick={onClick}>
      {label}
    </button>
  )
}

interface EventCardProps {
  event: Event
  selected: boolean
  onToggle: () => void
}

function EventCard({ event, selected, onToggle }: EventCardProps) {
  const card: React.CSSProperties = {
    padding: '14px 18px',
    borderRadius: '12px',
    border: `1.5px solid ${selected ? RED : GOLD}`,
    background: selected ? RED : CREAM,
    color: selected ? '#fff' : DARK,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'inherit',
  }
  const sub: React.CSSProperties = {
    fontSize: '0.75rem',
    opacity: 0.8,
    marginTop: '2px',
  }
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  return (
    <button type="button" style={card} onClick={onToggle}>
      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{event.name}</div>
      {(dateStr || event.time) && (
        <div style={sub}>
          {[dateStr, event.time].filter(Boolean).join(' · ')}
        </div>
      )}
    </button>
  )
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i + 1 === current ? '24px' : '8px',
            height: '8px',
            borderRadius: '9999px',
            background: i + 1 <= current ? GOLD : '#e5d9c8',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Input style helper ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderBottom: `1px solid ${GOLD}`,
  background: 'transparent',
  padding: '8px 0',
  color: DARK,
  fontSize: '1rem',
  fontFamily: 'inherit',
  outline: 'none',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: GOLD,
  marginBottom: '4px',
}

// ─── Success screen ───────────────────────────────────────────────────────────

interface SuccessScreenProps {
  name: string
  attending: boolean
  slug: string
  isOfflineQueued?: boolean
}

function SuccessScreen({ name, attending, slug, isOfflineQueued }: SuccessScreenProps) {
  const message = isOfflineQueued
    ? `Your RSVP is saved on this device and will be sent automatically when you're back online.`
    : attending
    ? `Thank you, ${name}! We can't wait to celebrate with you.`
    : `Thank you for letting us know, ${name}. We'll miss you!`

  const shareText = `You're invited! RSVP here: ${typeof window !== 'undefined' ? window.location.origin : ''}/i/${slug}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', color: DARK }}>
      <div style={{ fontSize: '4rem', color: GOLD, marginBottom: '16px' }}>&#10003;</div>
      <p style={{ fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '32px', fontFamily: 'inherit' }}>
        {message}
      </p>
      {attending && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '9999px',
            background: '#25D366',
            color: '#fff',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '0.9375rem',
            textDecoration: 'none',
          }}
        >
          Share the invite with family
        </a>
      )}
    </div>
  )
}

// ─── Supabase submit helper ───────────────────────────────────────────────────

async function submitToSupabase(weddingId: string, payload: RsvpPayload): Promise<void> {
  const supabase = createClient()

  const { data: submission, error: insertErr } = await supabase
    .from('rsvp_submissions')
    .insert({
      wedding_id: weddingId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      attending: payload.attending,
      dietary: payload.dietary,
      plus_one_name: payload.plus_one_name,
      plus_one_dietary: null,
      message: payload.message,
    })
    .select('id')
    .single()

  if (insertErr || !submission) {
    throw new Error(insertErr?.message ?? 'Insert failed')
  }

  if (payload.eventIds.length > 0) {
    await supabase.from('rsvp_event_responses').insert(
      payload.eventIds.map(eventId => ({
        rsvp_id: submission.id,
        event_id: eventId,
        attending: true,
      }))
    )
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RsvpForm({ weddingId, events, slug }: RsvpFormProps) {
  // Navigation
  const [step, setStep] = useState(1)

  // Step 1 — basic info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isAttending, setIsAttending] = useState<boolean | null>(null)

  // Step 2 — event attendance
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(events.map(e => e.id))

  // Step 3 — guest details
  const [selectedDietary, setSelectedDietary] = useState<string[]>([])
  const [hasPlusOne, setHasPlusOne] = useState<boolean | null>(null)
  const [plusOneName, setPlusOneName] = useState('')

  // Step 4 — message
  const [message, setMessage] = useState('')

  // Submission state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isOfflineQueued, setIsOfflineQueued] = useState(false)

  // Derived: total steps depends on whether attending
  const totalSteps = isAttending === false ? 1 : 4

  // Drain offline queue when connection is restored
  useEffect(() => {
    async function drainQueue() {
      const queue = readQueue()
      if (queue.length === 0) return
      const remaining: QueuedRsvp[] = []
      for (const item of queue) {
        try {
          await submitToSupabase(item.weddingId, item.payload)
        } catch {
          remaining.push(item)
        }
      }
      writeQueue(remaining)
    }
    window.addEventListener('online', drainQueue)
    drainQueue()
    return () => window.removeEventListener('online', drainQueue)
  }, [])

  function toggleEvent(id: string) {
    setSelectedEventIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  function toggleDietary(opt: string) {
    setSelectedDietary(prev =>
      prev.includes(opt) ? prev.filter(d => d !== opt) : [...prev, opt]
    )
  }

  function handleAttendance(val: boolean) {
    setIsAttending(val)
    if (!val) {
      // Skip to submit immediately on decline — stay on step 1 but submit
      handleDeclineSubmit(val)
    } else {
      setStep(2)
    }
  }

  async function handleDeclineSubmit(attending: boolean) {
    if (!name.trim()) {
      setError('Please enter your name before responding.')
      return
    }
    setError(null)
    setLoading(true)
    await submitRsvp({ attending, eventIds: [] })
    setLoading(false)
  }

  function handleBack() {
    setStep(s => Math.max(1, s - 1))
  }

  function handleNext() {
    if (step === 3 && hasPlusOne && !plusOneName.trim()) {
      setError("Please enter your guest's name.")
      return
    }
    setError(null)
    setStep(s => s + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    await submitRsvp({ attending: true, eventIds: selectedEventIds })
    setLoading(false)
  }

  async function submitRsvp({ attending, eventIds }: { attending: boolean; eventIds: string[] }) {
    const trimmedEmail = email.trim().toLowerCase()
    const payload: RsvpPayload = {
      name: name.trim(),
      email: trimmedEmail || null,
      phone: phone.trim() || null,
      attending,
      dietary: selectedDietary,
      plus_one_name: hasPlusOne ? plusOneName.trim() : null,
      message: message.trim() || null,
      eventIds,
    }

    // Offline: queue locally and show success
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queue = readQueue()
      queue.push({ weddingId, payload, timestamp: Date.now() })
      writeQueue(queue)
      setIsOfflineQueued(true)
      setSubmitted(true)
      return
    }

    // Duplicate guard
    const supabase = createClient()
    if (trimmedEmail) {
      const { data: existing } = await supabase
        .from('rsvp_submissions')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('email', trimmedEmail)
        .maybeSingle()

      if (existing) {
        setError('We already have your RSVP! Reach out to the couple if you need to make changes.')
        return
      }
    }

    try {
      await submitToSupabase(weddingId, payload)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  // ── Rendered ────────────────────────────────────────────────────────────────

  const wrapStyle: React.CSSProperties = {
    background: CREAM,
    color: DARK,
    fontFamily: 'inherit',
    minHeight: '100%',
  }

  const cardStyle: React.CSSProperties = {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '32px 24px 48px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: RED,
    marginBottom: '24px',
    letterSpacing: '-0.01em',
  }

  const fieldGap: React.CSSProperties = { marginBottom: '24px' }

  if (submitted) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <SuccessScreen
            name={name}
            attending={!!isAttending}
            slug={slug}
            isOfflineQueued={isOfflineQueued}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        {/* Progress */}
        {isAttending !== false && (
          <ProgressDots total={totalSteps} current={step} />
        )}

        {/* Back button */}
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: GOLD,
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              cursor: 'pointer',
              marginBottom: '20px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            &#8592; Back
          </button>
        )}

        {/* ── Step 1: Basic info ─────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <p style={sectionTitle}>Tell us who you are</p>

            <div style={fieldGap}>
              <label style={labelStyle} htmlFor="rsvp-name">Full Name *</label>
              <input
                id="rsvp-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
              />
            </div>

            <div style={fieldGap}>
              <label style={labelStyle} htmlFor="rsvp-email">
                Email (optional but helps us reach you)
              </label>
              <input
                id="rsvp-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ ...fieldGap, marginBottom: '36px' }}>
              <label style={labelStyle} htmlFor="rsvp-phone">Phone (optional)</label>
              <input
                id="rsvp-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={inputStyle}
              />
            </div>

            <p style={{ ...sectionTitle, fontSize: '1rem', marginBottom: '16px' }}>
              Will you be joining us?
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Pill
                label="Joyfully Accepts"
                selected={isAttending === true}
                onClick={() => handleAttendance(true)}
                variant="attendance"
              />
              <Pill
                label="Regretfully Declines"
                selected={isAttending === false}
                onClick={() => handleAttendance(false)}
                variant="attendance"
              />
            </div>

            {error && (
              <p style={{ color: RED, fontSize: '0.875rem', marginTop: '16px' }}>{error}</p>
            )}

            {loading && (
              <p style={{ color: GOLD, fontSize: '0.875rem', marginTop: '16px' }}>Sending…</p>
            )}
          </div>
        )}

        {/* ── Step 2: Event attendance ───────────────────────────────────── */}
        {step === 2 && isAttending && (
          <div>
            <p style={sectionTitle}>Which celebrations will you join?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
              {events.map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  selected={selectedEventIds.includes(ev.id)}
                  onToggle={() => toggleEvent(ev.id)}
                />
              ))}
            </div>

            {error && (
              <p style={{ color: RED, fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                background: RED,
                color: '#fff',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 3: Guest details ──────────────────────────────────────── */}
        {step === 3 && isAttending && (
          <div>
            <p style={sectionTitle}>A little more about you</p>

            <div style={fieldGap}>
              <p style={{ ...labelStyle, marginBottom: '12px' }}>Dietary restrictions</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DIETARY_OPTIONS.map(opt => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={selectedDietary.includes(opt)}
                    onClick={() => toggleDietary(opt)}
                  />
                ))}
              </div>
            </div>

            <div style={{ ...fieldGap, marginBottom: '36px' }}>
              <p style={{ ...labelStyle, marginBottom: '12px' }}>Are you bringing a guest?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Pill
                  label="Yes"
                  selected={hasPlusOne === true}
                  onClick={() => setHasPlusOne(true)}
                />
                <Pill
                  label="No"
                  selected={hasPlusOne === false}
                  onClick={() => setHasPlusOne(false)}
                />
              </div>

              {hasPlusOne && (
                <div style={{ marginTop: '20px' }}>
                  <label style={labelStyle} htmlFor="plus-one-name">+1 Name *</label>
                  <input
                    id="plus-one-name"
                    type="text"
                    required
                    value={plusOneName}
                    onChange={e => setPlusOneName(e.target.value)}
                    placeholder="Guest's full name"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>

            {error && (
              <p style={{ color: RED, fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                background: RED,
                color: '#fff',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 4: Message + submit ───────────────────────────────────── */}
        {step === 4 && isAttending && (
          <form onSubmit={handleSubmit}>
            <p style={sectionTitle}>Any words for the couple?</p>

            <div style={{ ...fieldGap, marginBottom: '36px' }}>
              <label style={labelStyle} htmlFor="rsvp-message">
                A note for the couple (optional)
              </label>
              <textarea
                id="rsvp-message"
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Share your excitement, a memory, or a wish…"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  borderBottom: `1px solid ${GOLD}`,
                }}
              />
            </div>

            {error && (
              <p style={{ color: RED, fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                background: loading ? '#b5443e' : RED,
                color: '#fff',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                transition: 'background 0.15s ease',
              }}
            >
              {loading ? 'Sending…' : 'Send RSVP'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
