import { useState } from 'react'
import { useDocuments, useDocument, useTasks, useAgents, useMutations } from '../lib/hooks'
import type { DocumentType } from '../lib/database.types'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Search,
  Plus,
  X,
  FileCheck,
  BookOpen,
  ScrollText,
  StickyNote,
  Pencil
} from 'lucide-react'

const typeIcons: Record<DocumentType, React.ReactNode> = {
  deliverable: <FileCheck className="w-4 h-4" />,
  research: <BookOpen className="w-4 h-4" />,
  protocol: <ScrollText className="w-4 h-4" />,
  draft: <Pencil className="w-4 h-4" />,
  note: <StickyNote className="w-4 h-4" />,
}

const typeColors: Record<DocumentType, string> = {
  deliverable: 'bg-green-500/20 text-green-400',
  research: 'bg-blue-500/20 text-blue-400',
  protocol: 'bg-purple-500/20 text-purple-400',
  draft: 'bg-yellow-500/20 text-yellow-400',
  note: 'bg-slate-500/20 text-slate-400',
}

export function DocumentPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all')
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [showNewDoc, setShowNewDoc] = useState(false)

  const { documents, loading } = useDocuments()

  const filteredDocs = documents
    .filter(doc => selectedType === 'all' || doc.type === selectedType)
    .filter(doc =>
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Document List */}
      <div className="w-1/3 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-mission-500" />
            Documents
          </h2>
          <button
            onClick={() => setShowNewDoc(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-mission-600 hover:bg-mission-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-mission-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedType('all')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              selectedType === 'all'
                ? 'bg-mission-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {(['deliverable', 'research', 'protocol', 'draft', 'note'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`text-xs px-2 py-1 rounded capitalize transition-colors ${
                selectedType === type
                  ? 'bg-mission-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-slate-400">Loading...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No documents found</div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedDoc === doc.id
                    ? 'bg-mission-600/20 border border-mission-500'
                    : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`p-1.5 rounded ${typeColors[doc.type]}`}>
                    {typeIcons[doc.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        by {doc.creator?.name}
                      </span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">v{doc.version}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {selectedDoc ? (
          <DocumentViewer docId={selectedDoc} onClose={() => setSelectedDoc(null)} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a document to view
          </div>
        )}
      </div>

      {/* New Document Modal */}
      {showNewDoc && <NewDocumentModal onClose={() => setShowNewDoc(false)} />}
    </div>
  )
}

function DocumentViewer({ docId, onClose }: { docId: string; onClose: () => void }) {
  const { document: doc, loading } = useDocument(docId)

  if (loading || !doc) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-4" />
        <div className="h-4 bg-slate-700 rounded w-full mb-2" />
        <div className="h-4 bg-slate-700 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`p-1 rounded ${typeColors[doc.type]}`}>
              {typeIcons[doc.type]}
            </span>
            <h2 className="text-lg font-semibold text-white">{doc.title}</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>by {doc.creator?.name}</span>
            <span>•</span>
            <span>Version {doc.version}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
          </div>
          {doc.task && (
            <div className="mt-2 text-sm text-mission-400">
              Task: {doc.task.title}
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-slate-300 font-sans">
            {doc.content}
          </pre>
        </div>
      </div>
    </div>
  )
}

function NewDocumentModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<DocumentType>('note')
  const [taskId, setTaskId] = useState<string>('')
  const [creatorId, setCreatorId] = useState<string>('')

  const { tasks } = useTasks()
  const { agents } = useAgents()
  const { createDocument } = useMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatorId) return

    await createDocument({
      title,
      content,
      type,
      taskId: taskId || undefined,
      createdBy: creatorId,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">New Document</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
              placeholder="Document title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
              >
                <option value="note">Note</option>
                <option value="draft">Draft</option>
                <option value="research">Research</option>
                <option value="protocol">Protocol</option>
                <option value="deliverable">Deliverable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Created By</label>
              <select
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
                required
              >
                <option value="">Select agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Related Task (optional)
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-mission-500"
            >
              <option value="">No related task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-mission-500"
              placeholder="Document content (Markdown supported)"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg transition-colors"
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
