'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { inviteTeammate, updateWeddingSettings, removeMember, updateMemberRole } from '@/app/[slug]/settings/actions'

interface Member {
  id: string
  user_id: string
  role: string
  displayName: string | null
  email: string | null
}

interface Wedding {
  id: string
  name: string
  date: string | null
  currency: string
  slug: string
}

interface SettingsClientProps {
  wedding: Wedding
  members: Member[]
  currentUserId: string
}

const CURRENCY_OPTIONS = ['INR', 'USD', 'GBP', 'EUR', 'AED']

export function SettingsClient({ wedding, members, currentUserId }: SettingsClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Wedding settings
  const [wName, setWName] = useState(wedding.name)
  const [wDate, setWDate] = useState(wedding.date ?? '')
  const [wCurrency, setWCurrency] = useState(wedding.currency)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null)

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Copied
  const [copied, setCopied] = useState(false)

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsLoading(true)
    setSettingsMsg(null)
    const result = await updateWeddingSettings(wedding.id, wName, wDate || null, wCurrency)
    setSettingsMsg(result.success ? 'Saved!' : result.error ?? 'Error')
    setSettingsLoading(false)
    if (result.success) startTransition(() => router.refresh())
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteMsg(null)
    const result = await inviteTeammate(wedding.id, inviteEmail, inviteRole)
    if (result.success) {
      setInviteMsg(
        result.alreadyHadAccount
          ? `${inviteEmail} added — they already have an account and can sign in now.`
          : `Invite sent to ${inviteEmail}! They'll get an email to set up their account.`
      )
    } else {
      setInviteMsg(result.error ?? 'Something went wrong')
    }
    setInviteLoading(false)
    if (result.success) {
      setInviteEmail('')
      startTransition(() => router.refresh())
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Remove this member?')) return
    await removeMember(memberId)
    startTransition(() => router.refresh())
  }

  async function handleRoleChange(memberId: string, role: string) {
    await updateMemberRole(memberId, role)
    startTransition(() => router.refresh())
  }

  async function handleDeleteWedding(e: React.FormEvent) {
    e.preventDefault()
    if (deleteConfirm !== wedding.name) return
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('weddings').delete().eq('id', wedding.id)
    router.push('/dashboard')
    router.refresh()
  }

  function copyInviteUrl() {
    navigator.clipboard.writeText(`${window.location.origin}/i/${wedding.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
  const labelCls = "text-xs font-medium text-gray-500 block mb-1"

  const ROLE_STYLES: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Team members */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <ul className="space-y-3">
          {members.map(member => (
            <li key={member.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${ROLE_STYLES[member.role] ?? 'bg-gray-100'}`}>
                  {member.role}
                </span>
                <div className="min-w-0">
                  <span className="text-sm text-gray-700 truncate block">
                    {member.user_id === currentUserId
                      ? `You${member.displayName ? ` (${member.displayName})` : ''}`
                      : member.displayName ?? member.email ?? member.user_id.slice(0, 12) + '…'}
                  </span>
                  {member.user_id !== currentUserId && member.email && (
                    <span className="text-xs text-gray-400 truncate block">{member.email}</span>
                  )}
                </div>
              </div>
              {member.user_id !== currentUserId && (
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Invite teammate */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Invite Teammate</h2>
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <label className={labelCls}>Email address</label>
            <input
              required
              type="email"
              className={inputCls}
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
            />
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <select className={inputCls} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="editor">Editor — can add/edit guests, vendors, tasks</option>
              <option value="viewer">Viewer — read-only</option>
            </select>
          </div>
          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.startsWith('Invited') ? 'text-green-600' : 'text-red-500'}`}>
              {inviteMsg}
            </p>
          )}
          <Button type="submit" disabled={inviteLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {inviteLoading ? 'Inviting…' : 'Send Invite'}
          </Button>
        </form>
      </section>

      {/* Wedding settings */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Wedding Details</h2>
        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div>
            <label className={labelCls}>Wedding name</label>
            <input required className={inputCls} value={wName} onChange={e => setWName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Wedding date</label>
            <input type="date" className={inputCls} value={wDate} onChange={e => setWDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select className={inputCls} value={wCurrency} onChange={e => setWCurrency(e.target.value)}>
              {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Invite link</label>
            <div className="flex gap-2">
              <input
                readOnly
                className={`${inputCls} bg-gray-50 text-gray-500`}
                value={typeof window !== 'undefined' ? `${window.location.origin}/i/${wedding.slug}` : `/i/${wedding.slug}`}
              />
              <button
                type="button"
                onClick={copyInviteUrl}
                className="shrink-0 text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          {settingsMsg && (
            <p className={`text-sm ${settingsMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}>
              {settingsMsg}
            </p>
          )}
          <Button type="submit" disabled={settingsLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {settingsLoading ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-red-100">
        <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-500">
          Permanently delete this wedding and all its data. This cannot be undone.
        </p>
        <form onSubmit={handleDeleteWedding} className="space-y-3">
          <div>
            <label className={labelCls}>
              Type <strong>{wedding.name}</strong> to confirm
            </label>
            <input
              className={inputCls}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={wedding.name}
            />
          </div>
          <Button
            type="submit"
            disabled={deleteConfirm !== wedding.name || deleteLoading}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {deleteLoading ? 'Deleting…' : 'Delete Wedding'}
          </Button>
        </form>
      </section>
    </div>
  )
}
