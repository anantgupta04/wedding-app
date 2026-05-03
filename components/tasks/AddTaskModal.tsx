'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  name: string
}

interface Member {
  user_id: string
}

interface AddTaskModalProps {
  weddingId: string
  events: Event[]
  members: Member[]
  memberDisplayNames: Record<string, string>
  currentUserId: string
  onClose: () => void
}

export function AddTaskModal({ weddingId, events, members, memberDisplayNames, currentUserId, onClose }: AddTaskModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [eventId, setEventId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('tasks').insert({
      wedding_id: weddingId,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
      event_id: eventId || null,
      assigned_to: assignedTo || null,
      status,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    onClose()
    router.refresh()
  }

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
  const labelCls = "text-xs font-medium text-gray-500"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Title *</label>
            <input required className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Book the caterer…" />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} rows={2} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    priority === p
                      ? p === 'high' ? 'bg-red-100 border-red-300 text-red-700'
                        : p === 'medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Due date</label>
              <input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as typeof status)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {events.length > 0 && (
            <div className="space-y-1">
              <label className={labelCls}>Link to event (optional)</label>
              <select className={inputCls} value={eventId} onChange={e => setEventId(e.target.value)}>
                <option value="">— No event —</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          )}

          {members.length > 0 && (
            <div className="space-y-1">
              <label className={labelCls}>Assign to (optional)</label>
              <select className={inputCls} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">— Unassigned —</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_id === currentUserId ? 'Me' : (memberDisplayNames[m.user_id] ?? m.user_id.slice(0, 8) + '…')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? 'Saving…' : 'Add Task'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
