import { describe, test, expect } from 'vitest'
import {
  rsvpConfirmationEmail,
  rsvpConfirmationSubject,
  newRsvpNotificationEmail,
  newRsvpNotificationSubject,
} from '@/lib/email/templates'

describe('rsvpConfirmationSubject', () => {
  test('contains the wedding name', () => {
    const subject = rsvpConfirmationSubject('Sharma-Gupta Wedding')
    expect(subject).toContain('Sharma-Gupta Wedding')
  })
})

describe('newRsvpNotificationSubject', () => {
  test('contains the guest name', () => {
    const subject = newRsvpNotificationSubject('Priya Sharma')
    expect(subject).toContain('Priya Sharma')
  })
})

describe('rsvpConfirmationEmail', () => {
  test('renders guest name and wedding name', () => {
    const html = rsvpConfirmationEmail({
      guestName: 'Rohit Verma',
      weddingName: 'Ananya & Karan',
      rsvpStatus: 'attending',
      events: [],
    })
    expect(html).toContain('Rohit Verma')
    expect(html).toContain('Ananya &amp; Karan')
  })

  test('includes event name and status for each event', () => {
    const html = rsvpConfirmationEmail({
      guestName: 'Neha',
      weddingName: 'Test Wedding',
      rsvpStatus: 'attending',
      events: [
        { eventName: 'Mehendi', status: 'attending' },
        { eventName: 'Reception', status: 'attending' },
      ],
    })
    expect(html).toContain('Mehendi')
    expect(html).toContain('Reception')
    expect(html).toContain('attending')
  })
})

describe('newRsvpNotificationEmail', () => {
  test('renders guest name and wedding name', () => {
    const html = newRsvpNotificationEmail({
      guestName: 'Amit Patel',
      weddingName: 'Deepika & Ravi',
      rsvpSummary: [],
    })
    expect(html).toContain('Amit Patel')
    expect(html).toContain('Deepika &amp; Ravi')
  })

  test('includes phone when provided', () => {
    const html = newRsvpNotificationEmail({
      guestName: 'Test Guest',
      guestPhone: '+91 98765 43210',
      weddingName: 'Test Wedding',
      rsvpSummary: [],
    })
    expect(html).toContain('+91 98765 43210')
  })

  test('omits phone section when not provided', () => {
    const html = newRsvpNotificationEmail({
      guestName: 'Test Guest',
      guestPhone: null,
      weddingName: 'Test Wedding',
      rsvpSummary: [],
    })
    expect(html).not.toContain('Phone')
  })
})
