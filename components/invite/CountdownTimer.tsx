'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  weddingDate: string | null
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function computeTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export default function CountdownTimer({ weddingDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    if (!weddingDate) return
    setTimeLeft(computeTimeLeft(weddingDate))
    const id = setInterval(() => setTimeLeft(computeTimeLeft(weddingDate)), 1000)
    return () => clearInterval(id)
  }, [weddingDate])

  if (!weddingDate || !timeLeft) return null

  return (
    <p
      style={{
        color: '#C9A84C',
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: '1.125rem',
        letterSpacing: '0.05em',
        marginTop: '0.75rem',
      }}
    >
      {pad(timeLeft.days)}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m{' '}
      {pad(timeLeft.seconds)}s
    </p>
  )
}
