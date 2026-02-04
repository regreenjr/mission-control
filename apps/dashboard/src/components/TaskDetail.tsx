import { useState } from 'react'
import { useTask, useMessages, useDocumentsByTask, useAgents, useTaskAssignees, useMutations } from '../lib/hooks'
import type { TaskStatus } from '../lib/database.types'
import { formatDistanceToNow } from 'date-fns'
import {
  X,
  MessageSquare,
  Send,
  User,
  Bot,
  Paperclip,
  Tag,
  Clock
} from 'lucide-react'

interface TaskDetailProps {
  taskId: string
  onClose: () => void
}

export function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { task, loading: taskLoading } = useTask(taskId)
  const { messages, loading: messagesLoading } = useMessages(taskId)
  const documents = useDocumentsByTask(taskId)
  const { agents } = useAgents()
  const currentAssignees = useTaskAssignees(taskId)
  const { assignTask, updateTaskStatus, createMessage } = useMutations()

  const [newComment, setNewComment] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  if (taskLoading || !task) {
    return (
      <div className="w-96 bg-slate-800 border-l border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-700 rounded w-2/3" />
        </div>
      </div>
    )
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    await createMessage({
      taskId,
      fromHuman: 'Human',
      content: newComment,
    })
    setNewComment('')
  }

  const handleAssign = async () => {
    await assignTask(taskId, selectedAgents)
    setSelectedAgents([])
  }

  const priorityColors = {
    low: 'text-slate-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  }

  const statusColors = {
    inbox: 'bg-slate-500',
    assigned: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    review: 'bg-purple-500',
    done: 'bg-green-500',
    blocked: 'bg-red-500',
  }

  const currentAssigneeIds = currentAssignees.map(a => a.id)

  return (
    <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">{task.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
            <span className="text-sm text-slate-400 capitalize">
              {task.status.replace('_', ' ')}
            </span>
            <span className={`text-sm ${priorityColors[task.priority]}`}>
              • {task.priority} priority
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Description */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
          <p className="text-sm text-slate-300">{task.description}</p>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assignment */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Assign Agents
          </h3>
          <div className="space-y-2">
            {agents.map((agent) => (
              <label
                key={agent.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent.id) || currentAssigneeIds.includes(agent.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAgents([...selectedAgents, agent.id])
                    } else {
                      setSelectedAgents(selectedAgents.filter((a) => a !== agent.id))
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-700 text-mission-500 focus:ring-mission-500"
                />
                <span className="text-sm text-slate-300">{agent.name}</span>
                <span className="text-xs text-slate-500">({agent.role})</span>
              </label>
            ))}
            {selectedAgents.length > 0 && (
              <button
                onClick={handleAssign}
                className="mt-2 px-3 py-1 text-sm bg-mission-600 hover:bg-mission-700 text-white rounded transition-colors"
              >
                Update Assignment
              </button>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Update Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {(['inbox', 'assigned', 'in_progress', 'review', 'done', 'blocked'] as const).map((status) => (
              <button
                key={status}
                onClick={() => updateTaskStatus(taskId, status)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  task.status === status
                    ? 'bg-mission-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Documents ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 bg-slate-700/50 rounded text-sm"
                >
                  <span className="text-white">{doc.title}</span>
                  <span className="text-slate-500 text-xs ml-2">v{doc.version}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({messages.length})
          </h3>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  {msg.from_agent ? (
                    <Bot className="w-4 h-4 text-mission-400" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {msg.from_agent?.name ?? msg.from_human ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-0.5">{msg.content}</p>
                  {msg.mentioned_agents && msg.mentioned_agents.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.mentioned_agents.map((agent) => (
                        <span
                          key={agent.id}
                          className="text-xs text-mission-400"
                        >
                          @{agent.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <form
        onSubmit={handleSubmitComment}
        className="p-4 border-t border-slate-700"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (use @name to mention)"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-mission-500"
          />
          <button
            type="submit"
            className="p-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
