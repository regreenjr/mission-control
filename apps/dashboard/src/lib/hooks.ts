import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import type {
  Agent,
  Task,
  TaskWithAssignees,
  MessageWithAgent,
  Activity,
  ActivityWithRelations,
  DocumentWithRelations,
  TaskStatus,
  TaskPriority,
  DocumentType,
} from './database.types'

// ============================================
// AGENTS HOOKS
// ============================================

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('level', { ascending: false })

    if (error) {
      setError(error)
    } else {
      setAgents(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAgents()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('agents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        fetchAgents()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAgents])

  return { agents, loading, error, refetch: fetchAgents }
}

export function useAgent(id: string | null) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setAgent(null)
      setLoading(false)
      return
    }

    const fetchAgent = async () => {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single()

      setAgent(data)
      setLoading(false)
    }

    fetchAgent()
  }, [id])

  return { agent, loading }
}

// ============================================
// TASKS HOOKS
// ============================================

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    setTasks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  return { tasks, loading, refetch: fetchTasks }
}

export function useTasksGrouped() {
  const [grouped, setGrouped] = useState<Record<TaskStatus, TaskWithAssignees[]>>({
    inbox: [],
    assigned: [],
    in_progress: [],
    review: [],
    done: [],
    blocked: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchGrouped = useCallback(async () => {
    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    // Fetch assignments with agents
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('*, agent:agents(*)')

    // Build assignment map
    const assignmentMap = new Map<string, Agent[]>()
    for (const a of assignments || []) {
      const list = assignmentMap.get(a.task_id) || []
      if (a.agent) list.push(a.agent as Agent)
      assignmentMap.set(a.task_id, list)
    }

    // Group tasks by status
    const result: Record<TaskStatus, TaskWithAssignees[]> = {
      inbox: [],
      assigned: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    }

    for (const task of tasks || []) {
      const enriched: TaskWithAssignees = {
        ...task,
        assignees: assignmentMap.get(task.id) || [],
      }
      result[task.status as TaskStatus].push(enriched)
    }

    setGrouped(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGrouped()

    const channel = supabase
      .channel('tasks-grouped-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchGrouped()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, () => {
        fetchGrouped()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchGrouped])

  return { grouped, loading, refetch: fetchGrouped }
}

export function useTask(id: string | null) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setTask(null)
      setLoading(false)
      return
    }

    const fetchTask = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      setTask(data)
      setLoading(false)
    }

    fetchTask()

    const channel = supabase
      .channel(`task-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${id}` }, () => {
        fetchTask()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  return { task, loading }
}

export function useTaskAssignees(taskId: string | null) {
  const [assignees, setAssignees] = useState<Agent[]>([])

  useEffect(() => {
    if (!taskId) {
      setAssignees([])
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('task_assignments')
        .select('*, agent:agents(*)')
        .eq('task_id', taskId)

      setAssignees((data || []).map(a => a.agent as Agent).filter(Boolean))
    }

    fetch()
  }, [taskId])

  return assignees
}

// ============================================
// MESSAGES HOOKS
// ============================================

export function useMessages(taskId: string | null) {
  const [messages, setMessages] = useState<MessageWithAgent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!taskId) {
      setMessages([])
      setLoading(false)
      return
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, from_agent:agents!messages_from_agent_id_fkey(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    // Fetch mentioned agents for each message
    const { data: agents } = await supabase.from('agents').select('*')
    const agentMap = new Map((agents || []).map(a => [a.id, a]))

    const enriched: MessageWithAgent[] = (msgs || []).map(msg => ({
      ...msg,
      from_agent: msg.from_agent as Agent | null,
      mentioned_agents: (msg.mentions || []).map(id => agentMap.get(id)).filter(Boolean) as Agent[],
    }))

    setMessages(enriched)
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchMessages()

    if (!taskId) return

    const channel = supabase
      .channel(`messages-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `task_id=eq.${taskId}` }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, fetchMessages])

  return { messages, loading, refetch: fetchMessages }
}

// ============================================
// ACTIVITIES HOOKS
// ============================================

export function useActivities(limit = 50) {
  const [activities, setActivities] = useState<ActivityWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    const { data } = await supabase
      .from('activities')
      .select('*, agent:agents(*), task:tasks(*)')
      .order('created_at', { ascending: false })
      .limit(limit)

    setActivities((data || []).map(a => ({
      ...a,
      agent: a.agent as Agent | null,
      task: a.task as Task | null,
    })))
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetchActivities()

    const channel = supabase
      .channel('activities-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, () => {
        fetchActivities()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActivities])

  return { activities, loading, refetch: fetchActivities }
}

export function useDailySummary() {
  const [summary, setSummary] = useState<{
    agentSummaries: Array<{
      agent: Agent
      stats: { tasksCompleted: number; messagesCount: number; documentsCreated: number; totalActivities: number }
      recentActivities: Activity[]
    }>
    totalStats: { tasksCompleted: number; tasksCreated: number; messages: number; documents: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const [{ data: activities }, { data: agents }] = await Promise.all([
        supabase
          .from('activities')
          .select('*')
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: false }),
        supabase.from('agents').select('*'),
      ])

      const activityList = activities || []
      const agentList = agents || []

      // Group by agent
      const byAgent = new Map<string, Activity[]>()
      for (const a of activityList) {
        if (a.agent_id) {
          const list = byAgent.get(a.agent_id) || []
          list.push(a)
          byAgent.set(a.agent_id, list)
        }
      }

      const agentSummaries = agentList.map(agent => {
        const agentActivities = byAgent.get(agent.id) || []
        return {
          agent,
          stats: {
            tasksCompleted: agentActivities.filter(a => a.type === 'task_completed').length,
            messagesCount: agentActivities.filter(a => a.type === 'message_sent').length,
            documentsCreated: agentActivities.filter(a => a.type === 'document_created').length,
            totalActivities: agentActivities.length,
          },
          recentActivities: agentActivities.slice(0, 5),
        }
      })

      const totalStats = {
        tasksCompleted: activityList.filter(a => a.type === 'task_completed').length,
        tasksCreated: activityList.filter(a => a.type === 'task_created').length,
        messages: activityList.filter(a => a.type === 'message_sent').length,
        documents: activityList.filter(a => a.type === 'document_created').length,
      }

      setSummary({ agentSummaries, totalStats })
      setLoading(false)
    }

    fetch()
  }, [])

  return { summary, loading }
}

// ============================================
// DOCUMENTS HOOKS
// ============================================

export function useDocuments(limit = 100) {
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from('documents')
      .select('*, creator:agents!documents_created_by_fkey(*), task:tasks(*)')
      .order('created_at', { ascending: false })
      .limit(limit)

    setDocuments((data || []).map(d => ({
      ...d,
      creator: d.creator as Agent | null,
      task: d.task as Task | null,
    })))
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetchDocuments()

    const channel = supabase
      .channel('documents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchDocuments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDocuments])

  return { documents, loading, refetch: fetchDocuments }
}

export function useDocument(id: string | null) {
  const [document, setDocument] = useState<DocumentWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setDocument(null)
      setLoading(false)
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*, creator:agents!documents_created_by_fkey(*), task:tasks(*)')
        .eq('id', id)
        .single()

      if (data) {
        setDocument({
          ...data,
          creator: data.creator as Agent | null,
          task: data.task as Task | null,
        })
      }
      setLoading(false)
    }

    fetch()
  }, [id])

  return { document, loading }
}

export function useDocumentsByTask(taskId: string | null) {
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([])

  useEffect(() => {
    if (!taskId) {
      setDocuments([])
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*, creator:agents!documents_created_by_fkey(*)')
        .eq('task_id', taskId)

      setDocuments((data || []).map(d => ({
        ...d,
        creator: d.creator as Agent | null,
        task: null,
      })))
    }

    fetch()
  }, [taskId])

  return documents
}

// ============================================
// MUTATIONS
// ============================================

export function useMutations() {
  // Agents
  const seedAgents = async () => {
    // Check if agents already exist
    const { data: existing } = await supabase.from('agents').select('id').limit(1)
    if (existing && existing.length > 0) {
      return { message: 'Agents already exist' }
    }

    const agents = [
      { name: 'Atlas', role: 'Squad Lead', session_key: 'agent:lead:main', level: 'lead' as const, avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas' },
      { name: 'Scout', role: 'Researcher', session_key: 'agent:researcher:main', level: 'specialist' as const, avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=scout' },
      { name: 'Scribe', role: 'Content Writer', session_key: 'agent:writer:main', level: 'specialist' as const, avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=scribe' },
    ]

    const { error } = await supabase.from('agents').insert(agents)
    if (error) throw error

    return { message: 'Seeded agents', count: agents.length }
  }

  const updateAgentStatus = async (id: string, status: 'idle' | 'active' | 'blocked') => {
    const { error } = await supabase.from('agents').update({ status }).eq('id', id)
    if (error) throw error
  }

  const recordHeartbeat = async (id: string) => {
    const { error } = await supabase
      .from('agents')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    // Log activity
    const { data: agent } = await supabase.from('agents').select('name').eq('id', id).single()
    if (agent) {
      await supabase.from('activities').insert({
        type: 'agent_heartbeat',
        agent_id: id,
        message: `${agent.name} checked in`,
      })
    }
  }

  // Tasks
  const createTask = async (data: {
    title: string
    description: string
    priority: TaskPriority
    tags?: string[]
    created_by?: string
    due_date?: string
  }) => {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description,
        priority: data.priority,
        tags: data.tags || [],
        created_by: data.created_by,
        due_date: data.due_date,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activities').insert({
      type: 'task_created',
      task_id: task.id,
      agent_id: data.created_by,
      message: `Task created: ${data.title}`,
    })

    return task
  }

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const { data: task } = await supabase.from('tasks').select('title').eq('id', id).single()

    const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
    if (error) throw error

    // Log activity
    await supabase.from('activities').insert({
      type: status === 'done' ? 'task_completed' : 'task_updated',
      task_id: id,
      message: `Task ${status === 'done' ? 'completed' : `moved to ${status}`}: ${task?.title}`,
    })
  }

  const assignTask = async (taskId: string, agentIds: string[]) => {
    // Remove existing assignments
    await supabase.from('task_assignments').delete().eq('task_id', taskId)

    // Add new assignments
    if (agentIds.length > 0) {
      const { error } = await supabase.from('task_assignments').insert(
        agentIds.map(agent_id => ({ task_id: taskId, agent_id }))
      )
      if (error) throw error

      // Update task status
      await supabase.from('tasks').update({ status: 'assigned' }).eq('id', taskId)

      // Update agents
      for (const agentId of agentIds) {
        await supabase.from('agents').update({ current_task_id: taskId, status: 'active' }).eq('id', agentId)
      }

      // Create subscriptions
      for (const agentId of agentIds) {
        await supabase.from('subscriptions').upsert({ agent_id: agentId, task_id: taskId })
      }
    } else {
      await supabase.from('tasks').update({ status: 'inbox' }).eq('id', taskId)
    }
  }

  // Messages
  const createMessage = async (data: {
    taskId: string
    fromAgentId?: string
    fromHuman?: string
    content: string
  }) => {
    // Parse @mentions
    const mentionPattern = /@(\w+)/g
    const mentionNames = [...data.content.matchAll(mentionPattern)].map(m => m[1].toLowerCase())

    const { data: agents } = await supabase.from('agents').select('id, name')
    const mentionedIds = (agents || [])
      .filter(a => mentionNames.includes(a.name.toLowerCase()))
      .map(a => a.id)

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        task_id: data.taskId,
        from_agent_id: data.fromAgentId,
        from_human: data.fromHuman,
        content: data.content,
        mentions: mentionedIds,
      })
      .select()
      .single()

    if (error) throw error

    // Create notifications for mentions
    for (const agentId of mentionedIds) {
      await supabase.from('notifications').insert({
        mentioned_agent_id: agentId,
        from_agent_id: data.fromAgentId,
        task_id: data.taskId,
        message_id: message.id,
        content: data.content,
      })
    }

    // Notify subscribed agents
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('agent_id')
      .eq('task_id', data.taskId)

    for (const sub of subscriptions || []) {
      if (!mentionedIds.includes(sub.agent_id) && sub.agent_id !== data.fromAgentId) {
        await supabase.from('notifications').insert({
          mentioned_agent_id: sub.agent_id,
          from_agent_id: data.fromAgentId,
          task_id: data.taskId,
          message_id: message.id,
          content: `New comment: ${data.content.substring(0, 100)}`,
        })
      }
    }

    // Log activity
    const fromAgent = data.fromAgentId
      ? (agents || []).find(a => a.id === data.fromAgentId)
      : null
    const { data: task } = await supabase.from('tasks').select('title').eq('id', data.taskId).single()

    await supabase.from('activities').insert({
      type: 'message_sent',
      agent_id: data.fromAgentId,
      task_id: data.taskId,
      message: `${fromAgent?.name ?? data.fromHuman ?? 'Someone'} commented on "${task?.title}"`,
    })

    return message
  }

  // Documents
  const createDocument = async (data: {
    title: string
    content: string
    type: DocumentType
    taskId?: string
    createdBy: string
  }) => {
    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        title: data.title,
        content: data.content,
        type: data.type,
        task_id: data.taskId,
        created_by: data.createdBy,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    const { data: agent } = await supabase.from('agents').select('name').eq('id', data.createdBy).single()
    const { data: task } = data.taskId
      ? await supabase.from('tasks').select('title').eq('id', data.taskId).single()
      : { data: null }

    await supabase.from('activities').insert({
      type: 'document_created',
      agent_id: data.createdBy,
      task_id: data.taskId,
      message: `${agent?.name} created document: ${data.title}${task ? ` for "${task.title}"` : ''}`,
    })

    return doc
  }

  // Notifications
  const markNotificationDelivered = async (id: string) => {
    await supabase.from('notifications').update({ delivered: true }).eq('id', id)
  }

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  return {
    seedAgents,
    updateAgentStatus,
    recordHeartbeat,
    createTask,
    updateTaskStatus,
    assignTask,
    createMessage,
    createDocument,
    markNotificationDelivered,
    markNotificationRead,
  }
}
