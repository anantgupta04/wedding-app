import type { Metadata } from 'next'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'You are Invited',
  description: 'Wedding invitation',
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; transition: none !important; }
          }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#FDF8F0', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
