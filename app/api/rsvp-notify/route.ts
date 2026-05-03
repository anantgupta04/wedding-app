import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/resend'
import {
  rsvpConfirmationEmail,
  rsvpConfirmationSubject,
  newRsvpNotificationEmail,
  newRsvpNotificationSubject,
  type RsvpSummaryItem,
} from '@/lib/email/templates'

interface NotifyBody {
  weddingId: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  rsvpSummary: RsvpSummaryItem[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: NotifyBody = await req.json()
    const { weddingId, guestName, guestEmail, guestPhone, rsvpSummary } = body

    const service = createServiceClient()

    const { data: wedding } = await service
      .from('weddings')
      .select('name, created_by')
      .eq('id', weddingId)
      .single<{ name: string; created_by: string }>()

    if (!wedding) return NextResponse.json({ ok: true })

    // Resolve owner email: check profiles first, fall back to auth.users
    const { data: profile } = await service
      .from('profiles')
      .select('email')
      .eq('user_id', wedding.created_by)
      .single<{ email: string | null }>()

    let ownerEmail = profile?.email ?? null
    if (!ownerEmail) {
      const { data: authUser } = await service.auth.admin.getUserById(wedding.created_by)
      ownerEmail = authUser?.user?.email ?? null
    }

    const weddingName = wedding.name
    const attending = rsvpSummary.length > 0

    // Notify the couple
    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: newRsvpNotificationSubject(guestName),
        html: newRsvpNotificationEmail({ guestName, guestEmail, guestPhone, weddingName, rsvpSummary }),
      })
    }

    // Confirm to guest
    if (guestEmail) {
      await sendEmail({
        to: guestEmail,
        subject: rsvpConfirmationSubject(weddingName),
        html: rsvpConfirmationEmail({
          guestName,
          weddingName,
          rsvpStatus: attending ? 'attending' : 'not attending',
          events: rsvpSummary,
        }),
      })
    }
  } catch (err) {
    console.error('[rsvp-notify] error:', err)
  }

  return NextResponse.json({ ok: true })
}
