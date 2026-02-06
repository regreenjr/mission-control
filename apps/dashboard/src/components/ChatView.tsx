import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  RefreshCw,
  User,
  Bot,
  AlertCircle,
  Clock,
  Loader2,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

// Gateway config
const GATEWAY_URL = 'http://localhost:38472'
const GATEWAY_TOKEN = 'xK9mQ4vL2pR7wZ8nJ3bT6yF1hD5sA0eC'

interface Agent {
  id: string
  name: string
  emoji: string
  role: string
  model: string
  status: 'online' | 'busy' | 'offline'
  sessionKey?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
}

interface Session {
  sessionKey: string
  agentId: string
  kind: string
  lastActivityAt?: string
  messageCount?: number
}

// Agent roster
const AGENTS: Agent[] = [
  { id: 'flash', name: 'Jarvis', emoji: '🎩', role: 'Human Interface', model: 'claude-opus-4-5', status: 'online' },
  { id: 'scout', name: 'Scout', emoji: '🔍', role: 'Research Specialist', model: 'claude-sonnet-4-5', status: 'online' },
  { id: 'dj', name: 'DJ', emoji: '⚡', role: 'Coding Agent', model: 'claude-sonnet-4-5', status: 'online' },
  { id: 'nightcrawler', name: 'Nightcrawler', emoji: '🌙', role: 'Night Shift Worker', model: 'claude-haiku-4.5', status: 'online' },
  { id: 'viral', name: 'Viral', emoji: '🎬', role: 'Content Lab', model: 'claude-sonnet-4-5', status: 'online' },
]

function AgentCard({
  agent,
  selected,
  onClick,
  lastMessage,
  unread
}: {
  agent: Agent
  selected: boolean
  onClick: () => void
  lastMessage?: string
  unread?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        selected
          ? 'bg-mission-600 text-white'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`relative text-2xl ${selected ? '' : 'grayscale-[30%]'}`}>
          {agent.emoji}
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
            selected ? 'border-mission-600' : 'border-slate-800'
          } ${
            agent.status === 'online' ? 'bg-green-500' :
            agent.status === 'busy' ? 'bg-yellow-500' :
            'bg-slate-500'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${selected ? 'text-white' : 'text-slate-200'}`}>
              {agent.name}
            </span>
            {unread && unread > 0 && (
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {unread}
              </span>
            )}
          </div>
          <div className={`text-xs truncate ${selected ? 'text-mission-200' : 'text-slate-500'}`}>
            {lastMessage || agent.role}
          </div>
        </div>
        
        <ChevronRight className={`w-4 h-4 ${selected ? 'text-mission-200' : 'text-slate-600'}`} />
      </div>
    </button>
  )
}

function MessageBubble({ message, agentEmoji }: { message: Message; agentEmoji: string }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
          {message.content}
        </span>
      </div>
    )
  }
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-mission-600' : 'bg-slate-700'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <span className="text-lg">{agentEmoji}</span>
        )}
      </div>
      
      <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-mission-600 text-white rounded-br-md'
            : 'bg-slate-700 text-slate-200 rounded-bl-md'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {format(message.timestamp, 'h:mm a')}
        </div>
      </div>
    </div>
  )
}

function ChatWindow({
  agent,
  messages,
  onSend,
  loading,
  error
}: {
  agent: Agent
  messages: Message[]
  onSend: (text: string) => void
  loading: boolean
  error: string | null
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  return (
    <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
        <span className="text-2xl">{agent.emoji}</span>
        <div>
          <div className="font-medium text-white">{agent.name}</div>
          <div className="text-xs text-slate-400">{agent.role} • {agent.model}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs ${
            agent.status === 'online' ? 'text-green-400' :
            agent.status === 'busy' ? 'text-yellow-400' :
            'text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              agent.status === 'online' ? 'bg-green-500' :
              agent.status === 'busy' ? 'bg-yellow-500' :
              'bg-slate-500'
            }`} />
            {agent.status}
          </span>
        </div>
      </div>
      
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">{agent.emoji}</div>
              <h3 className="text-lg font-medium text-white mb-1">Chat with {agent.name}</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                {agent.role}. Send a message to start the conversation.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} agentEmoji={agent.emoji} />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-lg">{agent.emoji}</span>
                </div>
                <div className="bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              rows={1}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-mission-500 focus:border-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-mission-600 hover:bg-mission-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}

function QuickActions({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    { label: 'Check inbox', icon: '📧', prompt: 'Check my email inbox and summarize any important messages' },
    { label: 'Daily brief', icon: '📋', prompt: 'Give me a quick daily briefing - calendar, tasks, and priorities' },
    { label: "What's next?", icon: '🎯', prompt: "What should I focus on next? What's the most important task?" },
    { label: 'Research', icon: '🔍', prompt: 'Help me research ' },
  ]
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
        >
          <span>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  )
}

export function ChatView() {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0])
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  
  // Check gateway connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${GATEWAY_URL}/api/status`, {
          headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }
        })
        setConnected(response.ok)
        if (!response.ok) {
          setError('Could not connect to Clawdbot gateway')
        }
      } catch {
        setConnected(false)
        setError('Could not connect to Clawdbot gateway — showing demo mode')
      }
    }
    
    checkConnection()
  }, [])
  
  const getAgentMessages = (agentId: string): Message[] => {
    return messages.get(agentId) || []
  }
  
  const addMessage = (agentId: string, message: Message) => {
    setMessages(prev => {
      const next = new Map(prev)
      const agentMessages = [...(next.get(agentId) || []), message]
      next.set(agentId, agentMessages)
      return next
    })
  }
  
  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    
    addMessage(selectedAgent.id, userMessage)
    setLoading(true)
    setError(null)
    
    try {
      if (connected) {
        // Real API call
        const response = await fetch(`${GATEWAY_URL}/api/sessions/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GATEWAY_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            message: text,
            timeoutSeconds: 120
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to send message')
        }
        
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || data.message || 'No response received',
          timestamp: new Date(),
          agentId: selectedAgent.id
        }
        
        addMessage(selectedAgent.id, assistantMessage)
      } else {
        // Demo mode - simulate response
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const demoResponses: Record<string, string> = {
          flash: "At your service, sir. I've reviewed your request and I'm ready to assist. What would you like me to help you with today?",
          scout: "I'll research that for you right away. Based on my initial analysis, here's what I've found...",
          dj: "I can help you build that. Let me write some code to solve this problem...",
          nightcrawler: "I've been monitoring things while you were away. Here's what happened overnight...",
          viral: "Great content idea! Let me help you create something that will resonate with your audience..."
        }
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: demoResponses[selectedAgent.id] || "I received your message. How can I help?",
          timestamp: new Date(),
          agentId: selectedAgent.id
        }
        
        addMessage(selectedAgent.id, assistantMessage)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleQuickAction = (prompt: string) => {
    handleSend(prompt)
  }
  
  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-mission-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Agent Chat</h2>
            <p className="text-sm text-slate-400">Direct communication with your agents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
            connected
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            {connected ? 'Connected' : 'Demo Mode'}
          </span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />
      
      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Agent List */}
        <div className="w-72 space-y-2 overflow-y-auto pr-2">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={selectedAgent.id === agent.id}
              onClick={() => setSelectedAgent(agent)}
              lastMessage={getAgentMessages(agent.id).slice(-1)[0]?.content?.slice(0, 50)}
            />
          ))}
          
          {/* Tips */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-mission-400 text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              Tips
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• <strong>Jarvis</strong> orchestrates the team</li>
              <li>• <strong>Scout</strong> for deep research</li>
              <li>• <strong>DJ</strong> for coding tasks</li>
              <li>• <strong>Viral</strong> for content creation</li>
            </ul>
          </div>
        </div>
        
        {/* Chat Window */}
        <ChatWindow
          agent={selectedAgent}
          messages={getAgentMessages(selectedAgent.id)}
          onSend={handleSend}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}
