import { useState, useEffect } from 'react'
import { 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  X,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns'

// Gateway config
import { GATEWAY_URL, GATEWAY_TOKEN } from '../lib/gateway'

// Task color categories
const TASK_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  'morning': { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', label: 'Morning' },
  'email': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', label: 'Email' },
  'research': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', label: 'Research' },
  'content': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', label: 'Content' },
  'report': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', label: 'Report' },
  'agent': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', label: 'Agent' },
  'default': { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', label: 'Other' },
}

interface CronJob {
  id: string
  name: string
  text?: string
  enabled: boolean
  schedule: {
    kind: string
    expr: string
    tz: string
  }
  state?: {
    lastRunAtMs?: number
    lastStatus?: string
    lastError?: string
    nextRunAtMs?: number
  }
}

interface ScheduledEvent {
  id: string
  jobId: string
  name: string
  text?: string
  time: string
  days: number[]
  color: keyof typeof TASK_COLORS
  enabled: boolean
  lastStatus?: string
  lastError?: string
  lastRunAt?: number
  nextRunAt?: number
  cronExpr: string
}

// Parse cron expression
function parseCronExpr(expr: string): { times: string[]; days: number[] } {
  const parts = expr.split(' ')
  if (parts.length < 5) return { times: [], days: [0, 1, 2, 3, 4, 5, 6] }
  
  const [minute, hour, , , dayOfWeek] = parts
  
  const times: string[] = []
  const hours = hour.includes(',') ? hour.split(',') : [hour]
  const minutes = minute.includes(',') ? minute.split(',') : [minute]
  
  for (const h of hours) {
    for (const m of minutes) {
      if (h !== '*' && m !== '*') {
        times.push(`${h.padStart(2, '0')}:${m.padStart(2, '0')}`)
      }
    }
  }
  
  let days: number[] = [0, 1, 2, 3, 4, 5, 6]
  if (dayOfWeek !== '*') {
    days = dayOfWeek.split(',').map(d => parseInt(d))
  }
  
  return { times, days }
}

// Categorize job by name
function getJobColor(name: string): keyof typeof TASK_COLORS {
  const lower = name.toLowerCase()
  if (lower.includes('brief') || lower.includes('morning')) return 'morning'
  if (lower.includes('email') || lower.includes('inbox')) return 'email'
  if (lower.includes('research') || lower.includes('scout')) return 'research'
  if (lower.includes('content') || lower.includes('viral')) return 'content'
  if (lower.includes('report') || lower.includes('cost')) return 'report'
  if (lower.includes('heartbeat') || lower.includes('agent') || lower.includes('dj') || lower.includes('nightcrawler')) return 'agent'
  return 'default'
}

// Convert cron jobs to events
function cronJobsToEvents(jobs: CronJob[]): ScheduledEvent[] {
  const events: ScheduledEvent[] = []
  
  for (const job of jobs) {
    if (!job.schedule?.expr) continue
    
    const { times, days } = parseCronExpr(job.schedule.expr)
    
    for (const time of times) {
      events.push({
        id: `${job.id}-${time}`,
        jobId: job.id,
        name: job.name,
        text: job.text,
        time,
        days,
        color: getJobColor(job.name),
        enabled: job.enabled,
        lastStatus: job.state?.lastStatus,
        lastError: job.state?.lastError,
        lastRunAt: job.state?.lastRunAtMs,
        nextRunAt: job.state?.nextRunAtMs,
        cronExpr: job.schedule.expr,
      })
    }
  }
  
  return events.sort((a, b) => a.time.localeCompare(b.time))
}

// Heartbeat banner
function HeartbeatBanner({ lastPing }: { lastPing: Date | null }) {
  return (
    <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-500/30 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <span className="text-emerald-300 font-medium">Always Running</span>
            <span className="text-emerald-400/60 ml-3 text-sm">jarvis heartbeat • Every 30 min</span>
          </div>
        </div>
        {lastPing && (
          <span className="text-emerald-400/60 text-sm">
            Last: {format(lastPing, 'h:mm a')}
          </span>
        )}
      </div>
    </div>
  )
}

// Day column
function DayColumn({ 
  date, 
  events, 
  isToday,
  onSelectEvent
}: { 
  date: Date
  events: ScheduledEvent[]
  isToday: boolean
  onSelectEvent: (event: ScheduledEvent) => void
}) {
  const dayEvents = events.filter(e => e.days.includes(date.getDay()))
  
  return (
    <div className={`flex-1 min-w-[120px] ${isToday ? 'bg-mission-900/20' : ''}`}>
      <div className={`text-center py-3 border-b border-slate-700 ${isToday ? 'bg-mission-600/20' : ''}`}>
        <div className="text-xs text-slate-500 uppercase">
          {format(date, 'EEE')}
        </div>
        <div className={`text-lg font-semibold ${isToday ? 'text-mission-400' : 'text-slate-300'}`}>
          {format(date, 'd')}
        </div>
      </div>
      
      <div className="p-2 space-y-2 min-h-[300px]">
        {dayEvents.map((event) => {
          const colors = TASK_COLORS[event.color]
          const hasError = event.lastStatus === 'error'
          
          return (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className={`
                w-full text-left ${colors.bg} ${colors.border} border rounded-lg p-2 text-xs
                ${!event.enabled ? 'opacity-50' : ''}
                ${hasError ? 'ring-1 ring-red-500/50' : ''}
                hover:scale-105 transition-transform cursor-pointer
              `}
              title={event.lastError || event.name}
            >
              <div className="flex items-center gap-1 mb-1">
                {hasError ? (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                ) : event.lastStatus === 'ok' ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-400" />
                )}
                <span className="text-slate-400">{event.time}</span>
              </div>
              <div className={`${colors.text} font-medium truncate`}>
                {event.name.replace(' Heartbeat', '').replace('Daily ', '')}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Task detail modal
function TaskDetailModal({
  event,
  onClose,
  onToggle,
  onDelete,
  onRunNow
}: {
  event: ScheduledEvent
  onClose: () => void
  onToggle: () => void
  onDelete: () => void
  onRunNow: () => void
}) {
  const colors = TASK_COLORS[event.color]
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
            <h3 className="text-lg font-semibold text-white">{event.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm w-24">Status:</span>
            {event.lastStatus === 'error' ? (
              <span className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Error
              </span>
            ) : event.lastStatus === 'ok' ? (
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                OK
              </span>
            ) : (
              <span className="text-slate-400 text-sm">Pending</span>
            )}
            {!event.enabled && (
              <span className="text-yellow-400 text-sm ml-2">(Disabled)</span>
            )}
          </div>
          
          {/* Schedule */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm w-24">Schedule:</span>
            <span className="text-white text-sm font-mono">{event.cronExpr}</span>
          </div>
          
          {/* Time */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm w-24">Runs at:</span>
            <span className="text-white text-sm">{event.time}</span>
          </div>
          
          {/* Days */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm w-24">Days:</span>
            <div className="flex gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <span
                  key={day}
                  className={`px-2 py-1 rounded text-xs ${
                    event.days.includes(i)
                      ? 'bg-mission-500/30 text-mission-300'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
          
          {/* Last Run */}
          {event.lastRunAt && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm w-24">Last run:</span>
              <span className="text-white text-sm">
                {format(new Date(event.lastRunAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )}
          
          {/* Next Run */}
          {event.nextRunAt && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm w-24">Next run:</span>
              <span className="text-white text-sm">
                {format(new Date(event.nextRunAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )}
          
          {/* Error */}
          {event.lastError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 text-sm font-medium mb-1">Last Error</div>
              <div className="text-red-300 text-sm">{event.lastError}</div>
            </div>
          )}
          
          {/* Task Text */}
          {event.text && (
            <div className="bg-slate-900 rounded-lg p-3">
              <div className="text-slate-400 text-sm font-medium mb-1">Task Text</div>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">{event.text}</div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                event.enabled
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {event.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {event.enabled ? 'Disable' : 'Enable'}
            </button>
            
            <button
              onClick={onRunNow}
              className="flex items-center gap-2 px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              Run Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// New task modal
function NewTaskModal({
  onClose,
  onSave
}: {
  onClose: () => void
  onSave: (task: { name: string; text: string; schedule: string }) => void
}) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [scheduleType, setScheduleType] = useState<'interval' | 'daily' | 'cron'>('daily')
  const [time, setTime] = useState('09:00')
  const [interval, setInterval] = useState('30')
  const [cronExpr, setCronExpr] = useState('0 9 * * *')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri
  
  const toggleDay = (day: number) => {
    setDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }
  
  const getScheduleExpr = (): string => {
    if (scheduleType === 'cron') return cronExpr
    if (scheduleType === 'interval') return `every ${interval}m`
    
    // Daily at specific time
    const [hour, minute] = time.split(':')
    const daysExpr = days.length === 7 ? '*' : days.join(',')
    return `${minute} ${hour} * * ${daysExpr}`
  }
  
  const handleSave = () => {
    if (!name.trim() || !text.trim()) return
    onSave({
      name: name.trim(),
      text: text.trim(),
      schedule: getScheduleExpr()
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">New Scheduled Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Task Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Morning Briefing"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mission-500"
            />
          </div>
          
          {/* Task Text */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Task Instructions</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What should the agent do?"
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mission-500 resize-none"
            />
          </div>
          
          {/* Schedule Type */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Schedule</label>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: 'Daily' },
                { value: 'interval', label: 'Interval' },
                { value: 'cron', label: 'Cron' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setScheduleType(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    scheduleType === opt.value
                      ? 'bg-mission-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Schedule Options */}
          {scheduleType === 'daily' && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-mission-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Days</label>
                <div className="flex gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        days.includes(i)
                          ? 'bg-mission-500/30 text-mission-300'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {scheduleType === 'interval' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Every (minutes)</label>
              <input
                type="number"
                value={interval}
                onChange={e => setInterval(e.target.value)}
                min="1"
                className="w-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-mission-500"
              />
            </div>
          )}
          
          {scheduleType === 'cron' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Cron Expression</label>
              <input
                type="text"
                value={cronExpr}
                onChange={e => setCronExpr(e.target.value)}
                placeholder="* * * * *"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mission-500"
              />
              <p className="text-xs text-slate-500 mt-1">minute hour day month weekday</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !text.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}

export function ScheduledTasks() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  
  const fetchCronJobs = async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/api/cron/list`, {
        headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setCronJobs(data.jobs || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch cron jobs:', err)
      setError('Could not connect to Clawdbot gateway')
      
      // Mock data
      setCronJobs([
        { id: '1', name: 'Daily Email Triage', enabled: true, schedule: { kind: 'cron', expr: '0 6 * * *', tz: 'America/Phoenix' }, state: { lastStatus: 'ok' } },
        { id: '2', name: 'Morning Briefing', enabled: true, schedule: { kind: 'cron', expr: '30 6 * * *', tz: 'America/Phoenix' }, state: { lastStatus: 'ok' } },
        { id: '3', name: 'Inbox Zero Check', enabled: true, schedule: { kind: 'cron', expr: '0 8,14,22 * * *', tz: 'America/Phoenix' }, state: { lastStatus: 'ok' } },
        { id: '4', name: 'AI Scarcity Research', enabled: true, schedule: { kind: 'cron', expr: '0 5 * * *', tz: 'America/Phoenix' }, state: { lastStatus: 'ok' } },
        { id: '5', name: 'Competitor YouTube Analysis', enabled: true, schedule: { kind: 'cron', expr: '0 10 * * 1,2,3,4,5', tz: 'America/Phoenix' }, state: { lastStatus: 'ok' } },
        { id: '6', name: 'Newsletter Reminder', enabled: true, schedule: { kind: 'cron', expr: '0 9 * * 2', tz: 'America/Phoenix' }, state: { lastStatus: 'ok' } },
      ])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCronJobs()
    const interval = setInterval(fetchCronJobs, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  const handleToggle = async () => {
    if (!selectedEvent) return
    // TODO: Call gateway API to toggle
    console.log('Toggle:', selectedEvent.jobId)
    setSelectedEvent(null)
    fetchCronJobs()
  }
  
  const handleDelete = async () => {
    if (!selectedEvent) return
    if (!confirm(`Delete "${selectedEvent.name}"?`)) return
    // TODO: Call gateway API to delete
    console.log('Delete:', selectedEvent.jobId)
    setSelectedEvent(null)
    fetchCronJobs()
  }
  
  const handleRunNow = async () => {
    if (!selectedEvent) return
    // TODO: Call gateway API to run
    console.log('Run now:', selectedEvent.jobId)
    alert(`Running "${selectedEvent.name}"...`)
  }
  
  const handleNewTask = async (task: { name: string; text: string; schedule: string }) => {
    // TODO: Call gateway API to create
    console.log('Create task:', task)
    setShowNewTask(false)
    fetchCronJobs()
  }
  
  const events = cronJobsToEvents(cronJobs)
  const today = new Date()
  const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), weekOffset)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-mission-500 animate-spin" />
      </div>
    )
  }
  
  return (
    <div>
      <HeartbeatBanner lastPing={new Date()} />
      
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 mb-4 text-yellow-400 text-sm">
          {error} — showing demo data
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-mission-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Scheduled Tasks</h2>
            <p className="text-sm text-slate-400">Jarvis's automated routines</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Week navigation */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          
          <button
            onClick={fetchCronJobs}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs mb-4">
        {Object.entries(TASK_COLORS).slice(0, -1).map(([key, colors]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
            <span className="text-slate-400">{colors.label}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex divide-x divide-slate-700">
          {weekDays.map((date) => (
            <DayColumn
              key={date.toISOString()}
              date={date}
              events={events}
              isToday={isSameDay(date, today)}
              onSelectEvent={setSelectedEvent}
            />
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-2xl font-bold text-white">{cronJobs.length}</div>
          <div className="text-sm text-slate-400">Total Jobs</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-2xl font-bold text-green-400">
            {cronJobs.filter(j => j.enabled && j.state?.lastStatus === 'ok').length}
          </div>
          <div className="text-sm text-slate-400">Running OK</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-2xl font-bold text-red-400">
            {cronJobs.filter(j => j.state?.lastStatus === 'error').length}
          </div>
          <div className="text-sm text-slate-400">Errors</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-2xl font-bold text-slate-400">
            {cronJobs.filter(j => !j.enabled).length}
          </div>
          <div className="text-sm text-slate-400">Disabled</div>
        </div>
      </div>
      
      {/* Modals */}
      {selectedEvent && (
        <TaskDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onRunNow={handleRunNow}
        />
      )}
      
      {showNewTask && (
        <NewTaskModal
          onClose={() => setShowNewTask(false)}
          onSave={handleNewTask}
        />
      )}
    </div>
  )
}
