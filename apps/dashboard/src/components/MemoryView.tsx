import { useState, useEffect } from 'react'
import { 
  Brain, 
  FileText, 
  FolderOpen, 
  RefreshCw, 
  Save, 
  Clock,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Search
} from 'lucide-react'
import { format } from 'date-fns'

interface MemoryFile {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: MemoryFile[]
  modified?: string
  size?: number
}

interface FileContent {
  path: string
  content: string
  modified?: string
}

// Gateway config
import { GATEWAY_URL, GATEWAY_TOKEN } from '../lib/gateway'

export function MemoryView() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<FileContent | null>(null)
  const [editedContent, setEditedContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['memory']))
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch file list from gateway
  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Try to fetch from gateway
      const response = await fetch(`${GATEWAY_URL}/api/workspace/files`, {
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      } else {
        throw new Error('Gateway not available')
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
      setError('Could not connect to Clawdbot gateway')
      
      // Use mock data for demo
      setFiles([
        {
          name: 'MEMORY.md',
          path: 'MEMORY.md',
          type: 'file',
          modified: new Date().toISOString(),
          size: 2048
        },
        {
          name: 'memory',
          path: 'memory',
          type: 'directory',
          children: [
            {
              name: '2026-02-06.md',
              path: 'memory/2026-02-06.md',
              type: 'file',
              modified: new Date().toISOString(),
              size: 4096
            },
            {
              name: '2026-02-05.md',
              path: 'memory/2026-02-05.md',
              type: 'file',
              modified: new Date(Date.now() - 86400000).toISOString(),
              size: 3200
            },
            {
              name: '2026-02-04.md',
              path: 'memory/2026-02-04.md',
              type: 'file',
              modified: new Date(Date.now() - 172800000).toISOString(),
              size: 2800
            },
            {
              name: 'heartbeat-state.json',
              path: 'memory/heartbeat-state.json',
              type: 'file',
              modified: new Date().toISOString(),
              size: 256
            }
          ]
        },
        {
          name: 'shared',
          path: 'shared',
          type: 'directory',
          children: [
            {
              name: 'USER.md',
              path: 'shared/USER.md',
              type: 'file',
              modified: new Date().toISOString(),
              size: 8192
            },
            {
              name: 'AGENTS_ROSTER.md',
              path: 'shared/AGENTS_ROSTER.md',
              type: 'file',
              modified: new Date().toISOString(),
              size: 1024
            }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fetch file content
  const fetchFileContent = async (path: string) => {
    setLoading(true)
    setSaveStatus('idle')
    
    try {
      const response = await fetch(`${GATEWAY_URL}/api/workspace/file?path=${encodeURIComponent(path)}`, {
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFileContent(data)
        setEditedContent(data.content)
      } else {
        throw new Error('Failed to fetch file')
      }
    } catch (err) {
      console.error('Failed to fetch file:', err)
      
      // Mock content for demo
      const mockContent = getMockContent(path)
      setFileContent({
        path,
        content: mockContent,
        modified: new Date().toISOString()
      })
      setEditedContent(mockContent)
    } finally {
      setLoading(false)
    }
  }

  // Save file content
  const saveFile = async () => {
    if (!selectedFile) return
    
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      const response = await fetch(`${GATEWAY_URL}/api/workspace/file`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: selectedFile,
          content: editedContent
        })
      })
      
      if (response.ok) {
        setSaveStatus('saved')
        setFileContent(prev => prev ? { ...prev, content: editedContent } : null)
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      console.error('Failed to save file:', err)
      setSaveStatus('error')
      // In demo mode, just pretend it saved
      if (error) {
        setSaveStatus('saved')
        setFileContent(prev => prev ? { ...prev, content: editedContent } : null)
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  // Load files on mount
  useEffect(() => {
    fetchFiles()
  }, [])

  // Load file content when selected
  useEffect(() => {
    if (selectedFile) {
      fetchFileContent(selectedFile)
    }
  }, [selectedFile])

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const hasChanges = fileContent && editedContent !== fileContent.content

  // Filter files by search
  const filterFiles = (items: MemoryFile[]): MemoryFile[] => {
    if (!searchQuery) return items
    
    return items.filter(item => {
      if (item.type === 'file') {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase())
      }
      if (item.children) {
        const filteredChildren = filterFiles(item.children)
        return filteredChildren.length > 0
      }
      return false
    }).map(item => {
      if (item.type === 'directory' && item.children) {
        return { ...item, children: filterFiles(item.children) }
      }
      return item
    })
  }

  const filteredFiles = filterFiles(files)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-mission-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Memory</h2>
            <p className="text-sm text-slate-400">Agent knowledge and learned context</p>
          </div>
        </div>
        
        <button
          onClick={fetchFiles}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 mb-4 text-yellow-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error} — showing demo data
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File Browser */}
        <div className="w-72 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mission-500"
              />
            </div>
          </div>
          
          {/* File Tree */}
          <div className="flex-1 overflow-auto p-2">
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 text-mission-500 animate-spin" />
              </div>
            ) : (
              <FileTree
                items={filteredFiles}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onSelectFile={setSelectedFile}
                onToggleFolder={toggleFolder}
              />
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
          {selectedFile ? (
            <>
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white font-medium">{selectedFile}</span>
                  {hasChanges && (
                    <span className="text-xs text-yellow-400">• unsaved</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </span>
                  )}
                  {fileContent?.modified && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(fileContent.modified), 'MMM d, h:mm a')}
                    </span>
                  )}
                  <button
                    onClick={saveFile}
                    disabled={!hasChanges || saving}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      hasChanges
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 p-4 overflow-auto">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mission-500"
                  placeholder="Select a file to view its contents..."
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No File Selected</h3>
                <p className="text-slate-400">Select a file from the sidebar to view and edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// File Tree Component
function FileTree({
  items,
  selectedFile,
  expandedFolders,
  onSelectFile,
  onToggleFolder,
  depth = 0
}: {
  items: MemoryFile[]
  selectedFile: string | null
  expandedFolders: Set<string>
  onSelectFile: (path: string) => void
  onToggleFolder: (path: string) => void
  depth?: number
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <div key={item.path}>
          {item.type === 'directory' ? (
            <>
              <button
                onClick={() => onToggleFolder(item.path)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-slate-700 transition-colors"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                {expandedFolders.has(item.path) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <FolderOpen className="w-4 h-4 text-yellow-500" />
                <span className="text-slate-300 text-sm">{item.name}</span>
              </button>
              
              {expandedFolders.has(item.path) && item.children && (
                <FileTree
                  items={item.children}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onSelectFile={onSelectFile}
                  onToggleFolder={onToggleFolder}
                  depth={depth + 1}
                />
              )}
            </>
          ) : (
            <button
              onClick={() => onSelectFile(item.path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                selectedFile === item.path
                  ? 'bg-mission-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <FileText className={`w-4 h-4 ${
                selectedFile === item.path ? 'text-white' : 'text-slate-400'
              }`} />
              <span className="text-sm truncate">{item.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// Mock content for demo mode
function getMockContent(path: string): string {
  if (path === 'MEMORY.md') {
    return `# MEMORY.md - Long-Term Memory

## Important Context

- **THE ONE THING**: Average 1000 views per post (unlocks client acquisition)
- Current focus: Content quality, posting software, platform detection

## Key Decisions

- 2026-02-06: Set up shared agent context infrastructure
- 2026-02-06: Registered all agents in Clawdbot config

## Lessons Learned

- Always write context to memory files during active work
- Use memory_search before answering questions about prior work
`
  }
  
  if (path.includes('2026-02-06')) {
    return `# 2026-02-06 - Daily Log

## Mission Control UI Upgrade

Updated Mission Control to include all header tabs:
- Tasks, Chat, Council, Calendar, Projects
- Memory, Captures, Docs, People, Org, Office
- Added search bar

## Shared Agent Context

Created /shared/ directory for canonical files:
- shared/USER.md - single source of truth about Robb
- shared/AGENTS_ROSTER.md - roster of all 5 agents
`
  }
  
  if (path.includes('USER.md')) {
    return `# USER.md - About Your Human

- **Name:** Robb
- **Timezone:** America/Phoenix
- **Current Focus:** THE ONE THING - Average 1000 views per post
`
  }
  
  return `# ${path}\n\nFile content would appear here.`
}
