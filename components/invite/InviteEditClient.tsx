'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InviteConfig {
  couple_names: string | null
  tagline: string | null
  story_text: string | null
  theme_color: string | null
  published: boolean
}

interface InviteEditClientProps {
  weddingId: string
  slug: string
  inviteConfig: InviteConfig | null
}

type ThemeColor = 'gold' | 'rose' | 'sage'

const THEME_OPTIONS: { value: ThemeColor; label: string; color: string }[] = [
  { value: 'gold', label: 'Gold', color: '#C9A84C' },
  { value: 'rose', label: 'Rose', color: '#E8637A' },
  { value: 'sage', label: 'Sage', color: '#7A9E7E' },
]

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
const labelCls = 'text-xs font-medium text-gray-500 block mb-1'

export function InviteEditClient({ weddingId, slug, inviteConfig }: InviteEditClientProps) {
  const [published, setPublished] = useState(inviteConfig?.published ?? false)
  const [coupleNames, setCoupleNames] = useState(inviteConfig?.couple_names ?? '')
  const [tagline, setTagline] = useState(inviteConfig?.tagline ?? '')
  const [storyText, setStoryText] = useState(inviteConfig?.story_text ?? '')
  const [themeColor, setThemeColor] = useState<ThemeColor>((inviteConfig?.theme_color as ThemeColor) ?? 'gold')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/i/${slug}`
    : `/i/${slug}`

  async function upsertConfig(patch: Partial<InviteConfig>) {
    const supabase = createClient()
    await supabase.from('invite_config').upsert(
      {
        wedding_id: weddingId,
        published,
        couple_names: coupleNames,
        tagline,
        story_text: storyText,
        theme_color: themeColor,
        updated_at: new Date().toISOString(),
        ...patch,
      },
      { onConflict: 'wedding_id' }
    )
  }

  async function handlePublishToggle() {
    const next = !published
    setPublished(next)
    await upsertConfig({ published: next })
    setSavedMsg(next ? 'Invite is now live!' : 'Invite hidden.')
    setTimeout(() => setSavedMsg(null), 3000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)
    await upsertConfig({})
    setSaving(false)
    setSavedMsg('Saved!')
    setTimeout(() => setSavedMsg(null), 3000)
  }

  function copyUrl() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Invite</h1>

      {/* Publish toggle */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {published ? 'Invite is LIVE' : 'Invite is hidden'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {published ? 'Guests can view the invitation.' : 'Only admins can see this.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePublishToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              published ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-pressed={published}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <p className={labelCls}>Public invite URL</p>
          <div className="flex gap-2">
            <input
              readOnly
              className={`${inputCls} bg-gray-50 text-gray-500 text-xs`}
              value={publicUrl}
            />
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <a
          href={`/i/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-purple-600 hover:text-purple-800 underline"
        >
          Preview invite
        </a>
      </section>

      {/* Invite content form */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Content</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelCls}>Couple names</label>
            <input
              className={inputCls}
              value={coupleNames}
              onChange={e => setCoupleNames(e.target.value)}
              placeholder="Anant & Priya"
            />
          </div>

          <div>
            <label className={labelCls}>Tagline</label>
            <input
              className={inputCls}
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Together we begin forever"
            />
          </div>

          <div>
            <label className={labelCls}>Our Story / Journey</label>
            <textarea
              className={`${inputCls} min-h-[120px] resize-y`}
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              placeholder="Write your love story here…"
            />
          </div>

          <div>
            <label className={labelCls}>Theme color</label>
            <div className="flex gap-3 mt-1">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThemeColor(opt.value)}
                  className={`flex flex-col items-center gap-1 focus:outline-none`}
                >
                  <span
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      themeColor === opt.value ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className={`text-xs ${themeColor === opt.value ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {savedMsg && (
              <p className="text-sm text-green-600 font-medium">{savedMsg}</p>
            )}
          </div>
        </form>
      </section>

      {/* Download PDF */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Download PDF</h2>
        <p className="text-sm text-gray-500 mb-4">
          Download a printable PDF version of the invite to share offline.
        </p>
        <a
          href={`/api/invite-pdf?slug=${slug}`}
          download
          className="inline-block bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Download PDF
        </a>
      </section>
    </div>
  )
}
