'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CardModal } from './CardModal'
import { ContactModal } from './ContactModal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvitationContact {
  id: string
  card_id: string
  label: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
}

export interface InvitationCard {
  id: string
  wedding_id: string
  family_name: string
  side: 'groom' | 'bride' | 'both'
  estimated_count: number
  status: 'not_contacted' | 'called' | 'invite_sent' | 'confirmed'
  notes: string | null
  invitation_contacts: InvitationContact[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_ORDER = ['not_contacted', 'called', 'invite_sent', 'confirmed'] as const
export type Status = typeof STATUS_ORDER[number]

export const STATUS_LABELS: Record<Status, string> = {
  not_contacted: 'Not Contacted',
  called: 'Called',
  invite_sent: 'Invite Sent',
  confirmed: 'Confirmed',
}

const STATUS_COLORS: Record<Status, string> = {
  not_contacted: 'bg-gray-100 text-gray-500',
  called: 'bg-yellow-100 text-yellow-700',
  invite_sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

const SIDE_COLORS: Record<string, string> = {
  groom: 'bg-blue-50 text-blue-600 border-blue-100',
  bride: 'bg-pink-50 text-pink-600 border-pink-100',
  both: 'bg-purple-50 text-purple-600 border-purple-100',
}

// ─── CSV utilities (exported for tests) ──────────────────────────────────────

export function parseCSVRow(line: string): string[] {
  const cols: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cols.push(current.trim())
  return cols
}

export interface CSVRow {
  familyName: string
  side: string
  estimatedCount: number
  label: string
  phone: string
  email: string
  notes: string
}

export function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  return lines
    .slice(1)
    .map(line => {
      const c = parseCSVRow(line)
      return {
        familyName: c[0] ?? '',
        side: c[1] ?? 'groom',
        estimatedCount: parseInt(c[2] ?? '1') || 1,
        label: c[3] ?? '',
        phone: c[4] ?? '',
        email: c[5] ?? '',
        notes: c[6] ?? '',
      }
    })
    .filter(r => r.familyName.length > 0)
}

export interface GroupedCard {
  familyName: string
  side: string
  estimatedCount: number
  notes: string
  contacts: { label: string; phone: string; email: string }[]
}

export function groupCSVRows(rows: CSVRow[]): GroupedCard[] {
  const map = new Map<string, GroupedCard>()
  for (const row of rows) {
    const key = row.familyName.toLowerCase().trim()
    if (!map.has(key)) {
      map.set(key, {
        familyName: row.familyName,
        side: row.side,
        estimatedCount: row.estimatedCount,
        notes: row.notes,
        contacts: [],
      })
    }
    if (row.phone || row.email || row.label) {
      map.get(key)!.contacts.push({
        label: row.label,
        phone: row.phone,
        email: row.email,
      })
    }
  }
  return Array.from(map.values())
}

function buildTemplateCSV(): string {
  return [
    'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes',
    '"Sharma Family",groom,4,Dad,+91 98765 43210,dad@example.com,Uncle side',
    '"Sharma Family",groom,4,Mom,+91 87654 32109,,',
    '"Mehta Family",bride,2,Auntie,,auntie@example.com,',
  ].join('\n')
}

// ─── Summary helpers ──────────────────────────────────────────────────────────

export function computeSummary(cards: InvitationCard[]) {
  const total = cards.length
  const totalPeople = cards.reduce((s, c) => s + c.estimated_count, 0)
  const groomPeople = cards.filter(c => c.side === 'groom' || c.side === 'both')
    .reduce((s, c) => s + c.estimated_count, 0)
  const bridePeople = cards.filter(c => c.side === 'bride' || c.side === 'both')
    .reduce((s, c) => s + c.estimated_count, 0)
  const byStatus = Object.fromEntries(
    STATUS_ORDER.map(s => [s, cards.filter(c => c.status === s).length])
  ) as Record<Status, number>
  return { total, totalPeople, groomPeople, bridePeople, byStatus }
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  weddingId: string
  initialCards: InvitationCard[]
}

export function InvitationsClient({ weddingId, initialCards }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [sideFilter, setSideFilter] = useState<'all' | 'groom' | 'bride'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<InvitationCard | null>(null)
  const [addingContactToCardId, setAddingContactToCardId] = useState<string | null>(null)
  const [editingContact, setEditingContact] = useState<InvitationContact | null>(null)

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  const filtered = useMemo(() => {
    return initialCards.filter(c => {
      if (sideFilter !== 'all' && c.side !== sideFilter && c.side !== 'both') return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      return true
    })
  }, [initialCards, sideFilter, statusFilter])

  const summary = useMemo(() => computeSummary(initialCards), [initialCards])

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function advanceStatus(card: InvitationCard) {
    const idx = STATUS_ORDER.indexOf(card.status)
    const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)]
    if (next === card.status) return
    await supabase.from('invitation_cards').update({ status: next }).eq('id', card.id)
    refresh()
  }

  async function deleteCard(id: string) {
    if (!confirm('Delete this family and all their contacts?')) return
    await supabase.from('invitation_cards').delete().eq('id', id)
    refresh()
  }

  async function deleteContact(id: string) {
    if (!confirm('Remove this contact?')) return
    await supabase.from('invitation_contacts').delete().eq('id', id)
    refresh()
  }

  function downloadTemplate() {
    const blob = new Blob([buildTemplateCSV()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invitation-list-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setImportError('No valid rows found. Make sure the file matches the template format.')
        return
      }
      const groups = groupCSVRows(rows)
      for (const group of groups) {
        const { data: card, error } = await supabase
          .from('invitation_cards')
          .insert({
            wedding_id: weddingId,
            family_name: group.familyName,
            side: ['groom', 'bride', 'both'].includes(group.side) ? group.side : 'groom',
            estimated_count: group.estimatedCount,
            notes: group.notes || null,
          })
          .select('id')
          .single()

        if (error || !card) continue

        if (group.contacts.length > 0) {
          await supabase.from('invitation_contacts').insert(
            group.contacts.map((ct, i) => ({
              card_id: card.id,
              label: ct.label || null,
              phone: ct.phone || null,
              email: ct.email || null,
              is_primary: i === 0,
            }))
          )
        }
      }
      refresh()
    } catch {
      setImportError('Failed to parse the file. Please use the template format.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{initialCards.length} families · {summary.totalPeople} estimated guests</p>
        </div>
        <Button onClick={() => { setEditingCard(null); setShowCardModal(true) }}
          className="bg-purple-600 hover:bg-purple-700 text-white shrink-0">
          + Add Family
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Groom side', value: summary.groomPeople, sub: 'est. guests' },
          { label: 'Bride side', value: summary.bridePeople, sub: 'est. guests' },
          { label: 'Invite sent', value: summary.byStatus.invite_sent, sub: 'families' },
          { label: 'Confirmed', value: summary.byStatus.confirmed, sub: 'families' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{s.value}</p>
            <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Status progress bar */}
      {initialCards.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outreach progress</p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {STATUS_ORDER.map(s => {
              const pct = (summary.byStatus[s] / initialCards.length) * 100
              const colors = { not_contacted: 'bg-gray-200', called: 'bg-yellow-300', invite_sent: 'bg-blue-400', confirmed: 'bg-green-400' }
              return pct > 0 ? <div key={s} style={{ width: `${pct}%` }} className={colors[s]} /> : null
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {STATUS_ORDER.map(s => (
              <span key={s} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{summary.byStatus[s]}</span> {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {(['all', 'groom', 'bride'] as const).map(s => (
            <button key={s} onClick={() => setSideFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                sideFilter === s ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-500'
              }`}>
              {s === 'all' ? 'All sides' : s.charAt(0).toUpperCase() + s.slice(1) + ' side'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...STATUS_ORDER] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-500'
              }`}>
              {s === 'all' ? 'All statuses' : STATUS_LABELS[s as Status]}
            </button>
          ))}
        </div>
      </div>

      {/* CSV import/export */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={downloadTemplate}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          ↓ Download template
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={importing}
          className="px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50">
          {importing ? 'Importing…' : '↑ Import CSV'}
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      </div>
      {importError && <p className="text-xs text-red-500">{importError}</p>}

      {/* Card list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-400">
            {initialCards.length === 0
              ? 'No families yet. Add one or import a CSV.'
              : 'No families match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(card => {
            const expanded = expandedIds.has(card.id)
            return (
              <div key={card.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="p-4 flex items-start gap-3">
                  <button onClick={() => toggleExpand(card.id)} className="mt-0.5 text-gray-300 hover:text-gray-500 text-xs shrink-0 w-4">
                    {expanded ? '▼' : '▶'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{card.family_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${SIDE_COLORS[card.side]}`}>
                        {card.side === 'both' ? 'Both sides' : card.side.charAt(0).toUpperCase() + card.side.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">~{card.estimated_count} {card.estimated_count === 1 ? 'person' : 'people'}</span>
                    </div>
                    {card.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{card.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => advanceStatus(card)}
                        title={card.status !== 'confirmed' ? `Mark as ${STATUS_LABELS[STATUS_ORDER[STATUS_ORDER.indexOf(card.status) + 1] ?? card.status]}` : undefined}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-70 ${STATUS_COLORS[card.status]}`}
                      >
                        {STATUS_LABELS[card.status]} {card.status !== 'confirmed' && '→'}
                      </button>
                      <span className="text-xs text-gray-400">{card.invitation_contacts.length} contact{card.invitation_contacts.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditingCard(card); setShowCardModal(true) }}
                      className="text-xs text-gray-400 hover:text-purple-600 px-1.5 py-1">Edit</button>
                    <button onClick={() => deleteCard(card.id)}
                      className="text-xs text-gray-300 hover:text-red-400 px-1.5 py-1">✕</button>
                  </div>
                </div>

                {/* Contacts (expanded) */}
                {expanded && (
                  <div className="border-t border-gray-50 px-4 pb-4 space-y-2 pt-3">
                    {card.invitation_contacts.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No contacts added yet.</p>
                    ) : (
                      card.invitation_contacts.map(ct => (
                        <div key={ct.id} className="flex items-center gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            {ct.label && <span className="text-xs font-medium text-gray-500 mr-1.5">{ct.label}</span>}
                            {ct.phone && (
                              <a href={`tel:${ct.phone}`} className="text-gray-700 hover:text-purple-600 mr-2">{ct.phone}</a>
                            )}
                            {ct.email && (
                              <a href={`mailto:${ct.email}`} className="text-gray-500 hover:text-purple-600 text-xs">{ct.email}</a>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setEditingContact(ct)}
                              className="text-xs text-gray-400 hover:text-purple-600 px-1 py-0.5">Edit</button>
                            <button onClick={() => deleteContact(ct.id)}
                              className="text-xs text-gray-300 hover:text-red-400 px-1 py-0.5">✕</button>
                          </div>
                        </div>
                      ))
                    )}
                    <button onClick={() => setAddingContactToCardId(card.id)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1">
                      + Add contact
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showCardModal && (
        <CardModal
          weddingId={weddingId}
          card={editingCard}
          onClose={() => { setShowCardModal(false); setEditingCard(null) }}
        />
      )}

      {addingContactToCardId && (
        <ContactModal
          cardId={addingContactToCardId}
          contact={null}
          onClose={() => setAddingContactToCardId(null)}
        />
      )}

      {editingContact && (
        <ContactModal
          cardId={editingContact.card_id}
          contact={editingContact}
          onClose={() => setEditingContact(null)}
        />
      )}
    </div>
  )
}
