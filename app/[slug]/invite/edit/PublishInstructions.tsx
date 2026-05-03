'use client'
import { useEffect, useState } from 'react'

export function PublishInstructions({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])

  return (
    <div className="text-xs text-gray-400 mt-2">
      Public URL: <span className="font-mono text-purple-600">{origin}/i/{slug}</span>
    </div>
  )
}
