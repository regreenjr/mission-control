import { useState } from 'react'
import { useAgents, useTasksGrouped, useMutations } from './lib/hooks'
import { useAuth } from './lib/auth'
import { TaskBoard } from './components/TaskBoard'
import { AgentCards } from './components/AgentCards'
import { ActivityFeed } from './components/ActivityFeed'
import { TaskDetail } from './components/TaskDetail'
import { DocumentPanel } from './components/DocumentPanel'
import { DailyStandup } from './components/DailyStandup'
import { ScheduledTasks } from './components/ScheduledTasks'
import { LoginPage } from './components/LoginPage'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Plus,
  RefreshCw,
  LogOut,
  Loader2,
  MessageSquare,
  Crown,
  FolderKanban,
  Brain,
  Camera,
  UserCircle,
  Building2,
  Briefcase,
  Search
} from 'lucide-react'

type View = 
  | 'tasks' 
  | 'chat' 
  | 'council' 
  | 'calendar' 
  | 'projects' 
  | 'memory' 
  | 'captures' 
  | 'docs' 
  | 'people' 
  | 'org' 
  | 'office'

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
  const [view, setView] = useState<View>('tasks')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { agents } = useAgents()
  const { seedAgents } = useMutations()

  const handleSeedAgents = async () => {
    try {
      await seedAgents()
    } catch (error) {
      console.error('Failed to seed agents:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement global search
    console.log('Searching for:', searchQuery)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-mission-500 to-mission-700 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Mission Control</h1>
              <p className="text-xs text-slate-400">Jarvis's automated routines</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mission-500 focus:border-transparent"
              />
            </form>

            {agents.length === 0 && (
              <button
                onClick={handleSeedAgents}
                className="flex items-center gap-2 px-3 py-2 bg-mission-600 hover:bg-mission-700 text-white text-sm rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Initialize
              </button>
            )}
            <button
              onClick={() => setShowNewTask(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
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
        
        {/* Top Navigation Tabs */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto">
          <TopTab 
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Tasks" 
            active={view === 'tasks'} 
            onClick={() => setView('tasks')} 
          />
          <TopTab 
            icon={<MessageSquare className="w-4 h-4" />}
            label="Chat" 
            active={view === 'chat'} 
            onClick={() => setView('chat')} 
          />
          <TopTab 
            icon={<Crown className="w-4 h-4" />}
            label="Council" 
            active={view === 'council'} 
            onClick={() => setView('council')} 
          />
          <TopTab 
            icon={<Calendar className="w-4 h-4" />}
            label="Calendar" 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
          />
          <TopTab 
            icon={<FolderKanban className="w-4 h-4" />}
            label="Projects" 
            active={view === 'projects'} 
            onClick={() => setView('projects')} 
          />
          <TopTab 
            icon={<Brain className="w-4 h-4" />}
            label="Memory" 
            active={view === 'memory'} 
            onClick={() => setView('memory')} 
          />
          <TopTab 
            icon={<Camera className="w-4 h-4" />}
            label="Captures" 
            active={view === 'captures'} 
            onClick={() => setView('captures')} 
          />
          <TopTab 
            icon={<FileText className="w-4 h-4" />}
            label="Docs" 
            active={view === 'docs'} 
            onClick={() => setView('docs')} 
          />
          <TopTab 
            icon={<UserCircle className="w-4 h-4" />}
            label="People" 
            active={view === 'people'} 
            onClick={() => setView('people')} 
          />
          <TopTab 
            icon={<Building2 className="w-4 h-4" />}
            label="Org" 
            active={view === 'org'} 
            onClick={() => setView('org')} 
          />
          <TopTab 
            icon={<Briefcase className="w-4 h-4" />}
            label="Office" 
            active={view === 'office'} 
            onClick={() => setView('office')} 
          />
        </div>
      </header>

      <div className="flex">
        {/* Slim Agent Status Sidebar */}
        <aside className="w-16 bg-slate-800 border-r border-slate-700 min-h-[calc(100vh-110px)] flex flex-col items-center py-4 gap-3">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Agents</div>
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className="relative group"
              title={`${agent.name} (${agent.role}) - ${agent.status}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                agent.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                'bg-slate-700 text-slate-400'
              }`}>
                {agent.name.charAt(0)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${
                agent.status === 'active' ? 'bg-green-500' :
                agent.status === 'blocked' ? 'bg-red-500' :
                'bg-slate-500'
              }`} />
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto min-h-[calc(100vh-110px)]">
          {view === 'tasks' && (
            <TaskBoard
              onSelectTask={setSelectedTaskId}
              showNewTask={showNewTask}
              onCloseNewTask={() => setShowNewTask(false)}
            />
          )}
          {view === 'chat' && <ChatView />}
          {view === 'council' && <CouncilView />}
          {view === 'calendar' && <ScheduledTasks />}
          {view === 'projects' && <ProjectsView />}
          {view === 'memory' && <MemoryView />}
          {view === 'captures' && <CapturesView />}
          {view === 'docs' && <DocumentPanel />}
          {view === 'people' && <PeopleView />}
          {view === 'org' && <OrgView />}
          {view === 'office' && <OfficeView />}
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

function TopTab({
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
      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
        active
          ? 'text-mission-400 border-mission-500'
          : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// Placeholder: Chat view - for agent conversations
function ChatView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Agent Chat</h2>
          <p className="text-sm text-slate-400">Direct communication with agents</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Chat directly with your AI agents. Send tasks, ask questions, and get real-time responses.
        </p>
      </div>
    </div>
  )
}

// Placeholder: Council view - for multi-agent deliberation
function CouncilView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Agent Council</h2>
          <p className="text-sm text-slate-400">Multi-agent deliberation and decisions</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <Crown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Convene your agent council for complex decisions. Scout researches, DJ builds, Viral creates — coordinated together.
        </p>
      </div>
    </div>
  )
}

// Placeholder: Projects view
function ProjectsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderKanban className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-sm text-slate-400">Track ongoing initiatives and workstreams</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <FolderKanban className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Organize work into projects. Track progress, assign agents, and monitor deliverables.
        </p>
      </div>
    </div>
  )
}

// Placeholder: Memory view
function MemoryView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Memory</h2>
          <p className="text-sm text-slate-400">Agent knowledge and learned context</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Browse and manage what your agents remember. Edit knowledge, add context, and review learnings.
        </p>
      </div>
    </div>
  )
}

// Placeholder: Captures view
function CapturesView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Camera className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Captures</h2>
          <p className="text-sm text-slate-400">Screenshots, recordings, and media</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          View screenshots, screen recordings, and other captured media from your agents.
        </p>
      </div>
    </div>
  )
}

// Placeholder: People view
function PeopleView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">People</h2>
          <p className="text-sm text-slate-400">Contacts and relationship management</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <UserCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Manage contacts, track interactions, and let agents help maintain relationships.
        </p>
      </div>
    </div>
  )
}

// Placeholder: Org view
function OrgView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Organization</h2>
          <p className="text-sm text-slate-400">Team structure and roles</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          View your agent team structure. Define roles, responsibilities, and reporting lines.
        </p>
      </div>
    </div>
  )
}

// Placeholder: Office view
function OfficeView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-mission-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Office</h2>
          <p className="text-sm text-slate-400">Workspace settings and environment</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Configure your workspace. Manage integrations, credentials, and environment settings.
        </p>
      </div>
    </div>
  )
}

export default App
