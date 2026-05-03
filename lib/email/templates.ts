function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const RED = '#8B1A1A'
const GOLD = '#C9A84C'
const CREAM = '#FDF8F0'
const DARK = '#2C1810'

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;background:${CREAM};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:${RED};padding:24px 32px;text-align:center;">
            <span style="color:${GOLD};font-size:1.5rem;letter-spacing:0.1em;">✦</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:${DARK};">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:${CREAM};padding:16px 32px;text-align:center;border-top:1px solid #e8dcc8;">
            <p style="margin:0;font-size:0.75rem;color:#9c8878;">Sent via Wedding App</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface RsvpSummaryItem {
  eventName: string
  status: string
}

export function rsvpConfirmationSubject(weddingName: string): string {
  return `Your RSVP for ${weddingName} is confirmed`
}

export function rsvpConfirmationEmail({
  guestName,
  weddingName,
  rsvpStatus,
  events,
}: {
  guestName: string
  weddingName: string
  rsvpStatus: 'attending' | 'not attending'
  events: RsvpSummaryItem[]
}): string {
  const attending = rsvpStatus === 'attending'
  const headline = attending
    ? `We can't wait to celebrate with you, ${esc(guestName)}!`
    : `We'll miss you, ${esc(guestName)}.`

  const eventsHtml =
    events.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          ${events
            .map(
              e => `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8dcc8;">
              <span style="font-weight:600;color:${DARK};">${esc(e.eventName)}</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #e8dcc8;text-align:right;">
              <span style="color:${attending ? RED : '#9c8878'};">${esc(e.status)}</span>
            </td>
          </tr>`
            )
            .join('')}
        </table>`
      : ''

  return layout(`
    <h1 style="margin:0 0 8px;font-size:1.5rem;color:${RED};">${esc(weddingName)}</h1>
    <p style="margin:0 0 24px;color:${GOLD};font-style:italic;">RSVP Confirmation</p>
    <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;">${headline}</p>
    <p style="margin:0;font-size:0.9375rem;color:#6b5a50;">Your response has been recorded.</p>
    ${eventsHtml}
  `)
}

export function newRsvpNotificationSubject(guestName: string): string {
  return `New RSVP from ${guestName}`
}

export function newRsvpNotificationEmail({
  guestName,
  guestEmail,
  guestPhone,
  weddingName,
  rsvpSummary,
}: {
  guestName: string
  guestEmail?: string | null
  guestPhone?: string | null
  weddingName: string
  rsvpSummary: RsvpSummaryItem[]
}): string {
  const contactRows = [
    guestEmail ? `<tr><td style="padding:6px 0;color:#6b5a50;width:80px;">Email</td><td style="padding:6px 0;">${esc(guestEmail)}</td></tr>` : '',
    guestPhone ? `<tr><td style="padding:6px 0;color:#6b5a50;">Phone</td><td style="padding:6px 0;">${esc(guestPhone)}</td></tr>` : '',
  ]
    .filter(Boolean)
    .join('')

  const eventsHtml =
    rsvpSummary.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
          ${rsvpSummary
            .map(
              e => `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;">${esc(e.eventName)}</td>
            <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:right;color:${RED};">${esc(e.status)}</td>
          </tr>`
            )
            .join('')}
        </table>`
      : ''

  return layout(`
    <h1 style="margin:0 0 4px;font-size:1.25rem;color:${RED};">${esc(weddingName)}</h1>
    <p style="margin:0 0 24px;color:${GOLD};font-style:italic;font-size:0.875rem;">New RSVP received</p>
    <p style="margin:0 0 16px;font-size:1.0625rem;font-weight:600;color:${DARK};">${esc(guestName)}</p>
    ${contactRows ? `<table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">${contactRows}</table>` : ''}
    ${eventsHtml}
  `)
}
