import { useState } from 'react'
import { useAgents, useTasksGrouped, useMutations } from './lib/hooks'
import { useAuth } from './lib/auth'
import { TaskBoard } from './components/TaskBoard'
import { AgentCards } from './components/AgentCards'
import { ActivityFeed } from './components/ActivityFeed'
import { TaskDetail } from './components/TaskDetail'
import { DocumentPanel } from './components/DocumentPanel'
import { DailyStandup } from './components/DailyStandup'
import { LoginPage } from './components/LoginPage'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Plus,
  RefreshCw,
  LogOut,
  Loader2
} from 'lucide-react'

type View = 'dashboard' | 'tasks' | 'documents' | 'standup'

function App() {
  const { user, loading: authLoading, signOut } = useAuth()

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-mission-500 animate-spin" />
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />
  }

  return <AuthenticatedApp user={user} signOut={signOut} />
}

function AuthenticatedApp({ user, signOut }: { user: { email?: string }, signOut: () => Promise<void> }) {
  const [view, setView] = useState<View>('dashboard')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)

  const { agents } = useAgents()
  const { seedAgents } = useMutations()

  const handleSeedAgents = async () => {
    try {
      await seedAgents()
    } catch (error) {
      console.error('Failed to seed agents:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-mission-500 to-mission-700 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mission Control</h1>
              <p className="text-sm text-slate-400">AI Agent Squad System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {agents.length === 0 && (
              <button
                onClick={handleSeedAgents}
                className="flex items-center gap-2 px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Initialize Agents
              </button>
            )}
            <button
              onClick={() => setShowNewTask(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <span className="text-sm text-slate-400">{user.email}</span>
              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-slate-800 border-r border-slate-700 min-h-[calc(100vh-73px)]">
          <div className="p-4 space-y-2">
            <NavItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              active={view === 'dashboard'}
              onClick={() => setView('dashboard')}
            />
            <NavItem
              icon={<Users className="w-5 h-5" />}
              label="Task Board"
              active={view === 'tasks'}
              onClick={() => setView('tasks')}
            />
            <NavItem
              icon={<FileText className="w-5 h-5" />}
              label="Documents"
              active={view === 'documents'}
              onClick={() => setView('documents')}
            />
            <NavItem
              icon={<Calendar className="w-5 h-5" />}
              label="Daily Standup"
              active={view === 'standup'}
              onClick={() => setView('standup')}
            />
          </div>

          {/* Agent Status */}
          <div className="p-4 border-t border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Agent Status
            </h3>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500 status-pulse' :
                    agent.status === 'blocked' ? 'bg-red-500' :
                    'bg-slate-500'
                  }`} />
                  <span className="text-slate-300">{agent.name}</span>
                  <span className="text-slate-500 text-xs">({agent.role})</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {view === 'dashboard' && (
            <DashboardView
              onSelectTask={setSelectedTaskId}
              onViewTasks={() => setView('tasks')}
            />
          )}
          {view === 'tasks' && (
            <TaskBoard
              onSelectTask={setSelectedTaskId}
              showNewTask={showNewTask}
              onCloseNewTask={() => setShowNewTask(false)}
            />
          )}
          {view === 'documents' && <DocumentPanel />}
          {view === 'standup' && <DailyStandup />}
        </main>

        {/* Task Detail Sidebar */}
        {selectedTaskId && (
          <TaskDetail
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-mission-600 text-white'
          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

function DashboardView({
  onSelectTask,
  onViewTasks
}: {
  onSelectTask: (id: string) => void
  onViewTasks: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Agent Cards */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-mission-500" />
          Agent Squad
        </h2>
        <AgentCards />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Tasks */}
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-mission-500" />
              Active Tasks
            </h2>
            <button
              onClick={onViewTasks}
              className="text-sm text-mission-400 hover:text-mission-300"
            >
              View All
            </button>
          </div>
          <QuickTaskList onSelectTask={onSelectTask} />
        </section>

        {/* Activity Feed */}
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-mission-500" />
            Recent Activity
          </h2>
          <ActivityFeed limit={10} />
        </section>
      </div>
    </div>
  )
}

function QuickTaskList({ onSelectTask }: { onSelectTask: (id: string) => void }) {
  const { grouped, loading } = useTasksGrouped()

  if (loading) {
    return <div className="text-slate-400">Loading...</div>
  }

  const activeTasks = [...grouped.in_progress, ...grouped.assigned].slice(0, 5)

  if (activeTasks.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        No active tasks. Create one to get started!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activeTasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onSelectTask(task.id)}
          className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{task.title}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {task.assignees?.map((agent) => (
              <span key={agent.id} className="text-xs text-slate-400">
                {agent.name}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}

export default App
