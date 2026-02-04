import { useActivities } from '../lib/hooks'
import type { ActivityType, ActivityWithRelations } from '../lib/database.types'
import { formatDistanceToNow } from 'date-fns'
import {
  PlusCircle,
  Edit3,
  CheckCircle2,
  MessageSquare,
  FileText,
  Zap,
  Heart
} from 'lucide-react'

interface ActivityFeedProps {
  limit?: number
}

export function ActivityFeed({ limit = 50 }: ActivityFeedProps) {
  const { activities, loading } = useActivities(limit)

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No activity yet. Start by creating a task!
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  task_created: <PlusCircle className="w-4 h-4 text-green-400" />,
  task_updated: <Edit3 className="w-4 h-4 text-blue-400" />,
  task_completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  message_sent: <MessageSquare className="w-4 h-4 text-purple-400" />,
  document_created: <FileText className="w-4 h-4 text-yellow-400" />,
  agent_started: <Zap className="w-4 h-4 text-orange-400" />,
  agent_heartbeat: <Heart className="w-4 h-4 text-red-400" />,
}

const activityColors: Record<ActivityType, string> = {
  task_created: 'bg-green-500/20',
  task_updated: 'bg-blue-500/20',
  task_completed: 'bg-green-500/20',
  message_sent: 'bg-purple-500/20',
  document_created: 'bg-yellow-500/20',
  agent_started: 'bg-orange-500/20',
  agent_heartbeat: 'bg-red-500/20',
}

function ActivityItem({ activity }: { activity: ActivityWithRelations }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
      <div className={`p-1.5 rounded-full ${activityColors[activity.type]}`}>
        {activityIcons[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">
          {activity.agent && (
            <span className="text-white font-medium">{activity.agent.name}</span>
          )}{' '}
          {activity.message}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
