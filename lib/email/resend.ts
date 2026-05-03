import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOpts {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOpts): Promise<void> {
  try {
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
