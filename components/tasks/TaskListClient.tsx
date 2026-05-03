'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AddTaskModal } from './AddTaskModal'

interface Event {
  id: string
  name: string
}

interface Member {
  user_id: string
}

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  due_date: string | null
  event_id: string | null
  assigned_to: string | null
}

interface TaskListClientProps {
  weddingId: string
  tasks: Task[]
  events: Event[]
  members: Member[]
  memberDisplayNames: Record<string, string>
  currentUserId: string
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(task.due_date) < today
}

export function TaskListClient({ weddingId, tasks, events, members, memberDisplayNames, currentUserId }: TaskListClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    startTransition(() => router.refresh())
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    startTransition(() => router.refresh())
  }

  const eventMap = Object.fromEntries(events.map(e => [e.id, e.name]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tasks.length} total</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
          + Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'todo', 'in_progress', 'done'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            {s === 'all' ? 'All' : s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}
          </button>
        ))}
        <div className="w-px bg-gray-200 self-stretch mx-1" />
        {['all', 'high', 'medium', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              priorityFilter === p ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            {p === 'all' ? 'All priority' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-400">{tasks.length === 0 ? 'No tasks yet. Add your first task!' : 'No tasks match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const overdue = isOverdue(task)
            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 ${overdue ? 'border-l-4 border-red-400' : ''} ${task.status === 'done' ? 'opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => toggleDone(task)}
                  className="mt-0.5 rounded border-gray-300 text-purple-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority] ?? 'bg-gray-100 text-gray-500'}`}>
                      {task.priority}
                    </span>
                    {overdue && (
                      <span className="text-xs text-red-500 font-medium">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {task.due_date && (
                      <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                        Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {task.event_id && eventMap[task.event_id] && (
                      <span className="text-xs text-purple-500">{eventMap[task.event_id]}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-300 hover:text-red-400 text-sm shrink-0 p-2"
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddTaskModal
          weddingId={weddingId}
          events={events}
          members={members}
          memberDisplayNames={memberDisplayNames}
          currentUserId={currentUserId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
