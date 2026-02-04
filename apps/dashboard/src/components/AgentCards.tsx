import { useAgents, useTask } from '../lib/hooks'
import type { Agent } from '../lib/database.types'
import { formatDistanceToNow } from 'date-fns'
import { Bot, Zap, Clock } from 'lucide-react'

export function AgentCards() {
  const { agents, loading } = useAgents()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
            <div className="h-12 w-12 bg-slate-700 rounded-full mb-4" />
            <div className="h-4 w-24 bg-slate-700 rounded mb-2" />
            <div className="h-3 w-16 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const { task: currentTask } = useTask(agent.current_task_id)

  const statusColors = {
    idle: 'bg-slate-500',
    active: 'bg-green-500',
    blocked: 'bg-red-500',
  }

  const levelBadgeColors = {
    intern: 'bg-purple-500/20 text-purple-400',
    specialist: 'bg-blue-500/20 text-blue-400',
    lead: 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-12 h-12 rounded-full bg-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mission-500 to-mission-700 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${statusColors[agent.status]} ${agent.status === 'active' ? 'status-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">{agent.name}</h3>
            <p className="text-slate-400 text-sm">{agent.role}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelBadgeColors[agent.level]}`}>
          {agent.level}
        </span>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Zap className="w-3 h-3" />
            Working on
          </div>
          <p className="text-sm text-white truncate">{currentTask.title}</p>
        </div>
      )}

      {/* Status & Last Activity */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          <span className="text-slate-400 capitalize">{agent.status}</span>
        </div>
        {agent.last_heartbeat && (
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">
              {formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
