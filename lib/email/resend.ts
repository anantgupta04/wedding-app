import { Resend } from 'resend'

interface SendEmailOpts {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOpts): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Wedding App <noreply@resend.dev>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[resend] failed to send email:', err)
  }
}
