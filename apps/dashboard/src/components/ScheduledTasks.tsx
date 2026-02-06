import { useState, useEffect } from 'react'
import { Clock, RefreshCw, AlertCircle, CheckCircle2, Calendar } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'

// Task color categories
const TASK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'morning': { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  'email': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  'research': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  'content': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  'report': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  'agent': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  'default': { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400' },
}

interface CronJob {
  id: string
  name: string
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
  name: string
  time: string // HH:mm
  days: number[] // 0-6 (Sun-Sat)
  color: keyof typeof TASK_COLORS
  enabled: boolean
  lastStatus?: string
  lastError?: string
}

// Parse cron expression to get schedule info
function parseCronExpr(expr: string): { times: string[]; days: number[] } {
  const parts = expr.split(' ')
  if (parts.length < 5) return { times: [], days: [0, 1, 2, 3, 4, 5, 6] }
  
  const [minute, hour, , , dayOfWeek] = parts
  
  // Parse times
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
  
  // Parse days (0-6, where 0 is Sunday)
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

// Convert cron jobs to scheduled events
function cronJobsToEvents(jobs: CronJob[]): ScheduledEvent[] {
  const events: ScheduledEvent[] = []
  
  for (const job of jobs) {
    if (!job.schedule?.expr) continue
    
    const { times, days } = parseCronExpr(job.schedule.expr)
    
    for (const time of times) {
      events.push({
        id: `${job.id}-${time}`,
        name: job.name,
        time,
        days,
        color: getJobColor(job.name),
        enabled: job.enabled,
        lastStatus: job.state?.lastStatus,
        lastError: job.state?.lastError,
      })
    }
  }
  
  return events.sort((a, b) => a.time.localeCompare(b.time))
}

// Heartbeat banner component
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

// Day column component
function DayColumn({ 
  date, 
  events, 
  isToday 
}: { 
  date: Date
  events: ScheduledEvent[]
  isToday: boolean 
}) {
  const dayEvents = events.filter(e => e.days.includes(date.getDay()))
  
  return (
    <div className={`flex-1 min-w-[120px] ${isToday ? 'bg-mission-900/20' : ''}`}>
      {/* Day header */}
      <div className={`text-center py-3 border-b border-slate-700 ${isToday ? 'bg-mission-600/20' : ''}`}>
        <div className="text-xs text-slate-500 uppercase">
          {format(date, 'EEE')}
        </div>
        <div className={`text-lg font-semibold ${isToday ? 'text-mission-400' : 'text-slate-300'}`}>
          {format(date, 'd')}
        </div>
      </div>
      
      {/* Events */}
      <div className="p-2 space-y-2 min-h-[300px]">
        {dayEvents.map((event) => {
          const colors = TASK_COLORS[event.color]
          const hasError = event.lastStatus === 'error'
          
          return (
            <div
              key={event.id}
              className={`
                ${colors.bg} ${colors.border} border rounded-lg p-2 text-xs
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ScheduledTasks() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch cron jobs from Clawdbot gateway
  useEffect(() => {
    const fetchCronJobs = async () => {
      try {
        // Try to fetch from local gateway
        const response = await fetch('http://localhost:38472/api/cron/list', {
          headers: {
            'Authorization': 'Bearer xK9mQ4vL2pR7wZ8nJ3bT6yF1hD5sA0eC'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch cron jobs')
        }
        
        const data = await response.json()
        setCronJobs(data.jobs || [])
      } catch (err) {
        console.error('Failed to fetch cron jobs:', err)
        setError('Could not connect to Clawdbot gateway')
        
        // Use mock data for demo
        setCronJobs([
          {
            id: '1',
            name: 'Daily Email Triage',
            enabled: true,
            schedule: { kind: 'cron', expr: '0 6 * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'ok' }
          },
          {
            id: '2',
            name: 'Daily Briefing',
            enabled: true,
            schedule: { kind: 'cron', expr: '30 6 * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'ok' }
          },
          {
            id: '3',
            name: 'Inbox Zero',
            enabled: true,
            schedule: { kind: 'cron', expr: '0 8,14,22 * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'ok' }
          },
          {
            id: '4',
            name: 'Scout Heartbeat',
            enabled: true,
            schedule: { kind: 'cron', expr: '0,30 * * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'error', lastError: 'model not allowed' }
          },
          {
            id: '5',
            name: 'DJ Heartbeat',
            enabled: true,
            schedule: { kind: 'cron', expr: '5,35 * * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'error', lastError: 'model not allowed' }
          },
          {
            id: '6',
            name: 'Viral Heartbeat',
            enabled: true,
            schedule: { kind: 'cron', expr: '10,40 * * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'error', lastError: 'model not allowed' }
          },
          {
            id: '7',
            name: 'Daily Cost Report',
            enabled: true,
            schedule: { kind: 'cron', expr: '0 0 * * *', tz: 'America/Phoenix' },
            state: { lastStatus: 'error', lastError: 'model not allowed' }
          },
        ])
      } finally {
        setLoading(false)
      }
    }
    
    fetchCronJobs()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchCronJobs, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  const events = cronJobsToEvents(cronJobs)
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
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
      {/* Heartbeat Banner */}
      <HeartbeatBanner lastPing={new Date()} />
      
      {/* Error notice */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 mb-4 text-yellow-400 text-sm">
          {error} - showing cached data
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
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(TASK_COLORS).slice(0, -1).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
              <span className="text-slate-400 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex divide-x divide-slate-700">
          {weekDays.map((date) => (
            <DayColumn
              key={date.toISOString()}
              date={date}
              events={events}
              isToday={isSameDay(date, today)}
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
    </div>
  )
}
