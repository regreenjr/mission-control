import { useDailySummary } from '../lib/hooks'
import {
  Calendar,
  CheckCircle2,
  MessageSquare,
  FileText,
  Activity,
  Bot
} from 'lucide-react'

export function DailyStandup() {
  const { summary, loading } = useDailySummary()

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { agentSummaries, totalStats } = summary

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-mission-500" />
            Daily Standup
          </h2>
          <p className="text-slate-400 mt-1">Last 24 hours activity summary</p>
        </div>
        <div className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          label="Tasks Completed"
          value={totalStats.tasksCompleted}
          color="bg-green-500/10 border-green-500/30"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          label="Tasks Created"
          value={totalStats.tasksCreated}
          color="bg-blue-500/10 border-blue-500/30"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-purple-400" />}
          label="Messages"
          value={totalStats.messages}
          color="bg-purple-500/10 border-purple-500/30"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-yellow-400" />}
          label="Documents"
          value={totalStats.documents}
          color="bg-yellow-500/10 border-yellow-500/30"
        />
      </div>

      {/* Agent Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agentSummaries.map(({ agent, stats, recentActivities }) => (
          <div
            key={agent.id}
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
          >
            {/* Agent Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-750">
              <div className="flex items-center gap-3">
                {agent.avatar_url ? (
                  <img
                    src={agent.avatar_url}
                    alt={agent.name}
                    className="w-10 h-10 rounded-full bg-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mission-500 to-mission-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold">{agent.name}</h3>
                  <p className="text-sm text-slate-400">{agent.role}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-700">
              <div>
                <div className="text-2xl font-bold text-white">{stats.tasksCompleted}</div>
                <div className="text-xs text-slate-400">Tasks Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.messagesCount}</div>
                <div className="text-xs text-slate-400">Messages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.documentsCreated}</div>
                <div className="text-xs text-slate-400">Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalActivities}</div>
                <div className="text-xs text-slate-400">Total Actions</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </h4>
              {recentActivities.length > 0 ? (
                <div className="space-y-2">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="text-sm text-slate-300 truncate"
                    >
                      {activity.message}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent activity</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Team Health */}
      {agentSummaries.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Team Health</h3>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-sm text-slate-400 mb-2">Activity Distribution</div>
              <div className="space-y-2">
                {agentSummaries.map(({ agent, stats }) => {
                  const total = agentSummaries.reduce(
                    (sum, s) => sum + s.stats.totalActivities,
                    0
                  )
                  const pct = total > 0 ? (stats.totalActivities / total) * 100 : 0
                  return (
                    <div key={agent.id} className="flex items-center gap-2">
                      <span className="text-sm text-slate-300 w-20">{agent.name}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-mission-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-2">Top Performer</div>
              {(() => {
                const top = agentSummaries.reduce(
                  (prev, curr) =>
                    curr.stats.totalActivities > prev.stats.totalActivities ? curr : prev,
                  agentSummaries[0]
                )
                return top ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{top.agent.name}</div>
                      <div className="text-sm text-slate-400">
                        {top.stats.totalActivities} activities
                      </div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-2">Squad Status</div>
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {totalStats.tasksCompleted >= 5
                    ? '🚀'
                    : totalStats.tasksCompleted >= 2
                    ? '👍'
                    : '💪'}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {totalStats.tasksCompleted >= 5
                      ? 'Crushing It!'
                      : totalStats.tasksCompleted >= 2
                      ? 'Making Progress'
                      : 'Getting Started'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {totalStats.tasksCompleted} tasks completed today
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`${color} border rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  )
}
