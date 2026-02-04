import { useState } from 'react'
import { useTasksGrouped, useMutations } from '../lib/hooks'
import type { TaskStatus, TaskPriority, TaskWithAssignees } from '../lib/database.types'
import {
  Inbox,
  UserCheck,
  PlayCircle,
  Eye,
  CheckCircle2,
  AlertOctagon,
  X,
  GripVertical
} from 'lucide-react'

const columns: { key: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, color: 'bg-slate-500' },
  { key: 'assigned', label: 'Assigned', icon: <UserCheck className="w-4 h-4" />, color: 'bg-yellow-500' },
  { key: 'in_progress', label: 'In Progress', icon: <PlayCircle className="w-4 h-4" />, color: 'bg-blue-500' },
  { key: 'review', label: 'Review', icon: <Eye className="w-4 h-4" />, color: 'bg-purple-500' },
  { key: 'done', label: 'Done', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-500' },
]

interface TaskBoardProps {
  onSelectTask: (id: string) => void
  showNewTask: boolean
  onCloseNewTask: () => void
}

export function TaskBoard({ onSelectTask, showNewTask, onCloseNewTask }: TaskBoardProps) {
  const { grouped, loading } = useTasksGrouped()
  const { updateTaskStatus } = useMutations()

  const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="bg-slate-800 rounded-xl p-4 min-h-[400px] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showNewTask && <NewTaskModal onClose={onCloseNewTask} />}

      {/* Blocked Tasks Alert */}
      {grouped.blocked.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <span className="text-red-300">
            {grouped.blocked.length} task{grouped.blocked.length > 1 ? 's' : ''} blocked
          </span>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.key}
            column={col}
            tasks={grouped[col.key] || []}
            onSelectTask={onSelectTask}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  column: { key: TaskStatus; label: string; icon: React.ReactNode; color: string }
  tasks: TaskWithAssignees[]
  onSelectTask: (id: string) => void
  onDrop: (taskId: string, status: TaskStatus) => void
}

function KanbanColumn({ column, tasks, onSelectTask, onDrop }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      onDrop(taskId, column.key)
    }
  }

  return (
    <div
      className={`bg-slate-800 rounded-xl border transition-colors ${
        isDragOver ? 'border-mission-500 bg-slate-700/50' : 'border-slate-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded ${column.color}/20 text-white`}>
            {column.icon}
          </span>
          <span className="font-medium text-white">{column.label}</span>
          <span className="ml-auto text-sm text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-2 space-y-2 min-h-[300px] max-h-[600px] overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={() => onSelectTask(task.id)} />
        ))}
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: TaskWithAssignees
  onSelect: () => void
}

function TaskCard({ task, onSelect }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id)
  }

  const priorityColors = {
    low: 'border-l-slate-400',
    medium: 'border-l-blue-400',
    high: 'border-l-orange-400',
    urgent: 'border-l-red-400',
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`task-card bg-slate-700/50 hover:bg-slate-700 rounded-lg p-3 cursor-pointer border-l-4 ${priorityColors[task.priority]}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-500 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate">{task.title}</h4>
          <p className="text-slate-400 text-xs mt-1 line-clamp-2">{task.description}</p>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-slate-600 text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {task.assignees.map((agent) => (
                <span
                  key={agent.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-mission-500/20 text-mission-300"
                >
                  {agent.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewTaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [tags, setTags] = useState('')

  const { createTask } = useMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTask({
      title,
      description,
      priority,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
              placeholder="Task description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
              placeholder="research, writing, urgent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
