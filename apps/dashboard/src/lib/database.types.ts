export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AgentStatus = 'idle' | 'active' | 'blocked'
export type AgentLevel = 'intern' | 'specialist' | 'lead'
export type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ActivityType = 'task_created' | 'task_updated' | 'task_completed' | 'message_sent' | 'document_created' | 'agent_started' | 'agent_heartbeat'
export type DocumentType = 'deliverable' | 'research' | 'protocol' | 'draft' | 'note'

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          role: string
          session_key: string
          status: AgentStatus
          current_task_id: string | null
          level: AgentLevel
          avatar_url: string | null
          last_heartbeat: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          session_key: string
          status?: AgentStatus
          current_task_id?: string | null
          level: AgentLevel
          avatar_url?: string | null
          last_heartbeat?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          session_key?: string
          status?: AgentStatus
          current_task_id?: string | null
          level?: AgentLevel
          avatar_url?: string | null
          last_heartbeat?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: TaskStatus
          priority: TaskPriority
          created_by: string | null
          due_date: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: TaskStatus
          priority?: TaskPriority
          created_by?: string | null
          due_date?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: TaskStatus
          priority?: TaskPriority
          created_by?: string | null
          due_date?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          agent_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          task_id: string
          agent_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          agent_id?: string
          assigned_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          task_id: string
          from_agent_id: string | null
          from_human: string | null
          content: string
          attachments: string[]
          mentions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          from_agent_id?: string | null
          from_human?: string | null
          content: string
          attachments?: string[]
          mentions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          from_agent_id?: string | null
          from_human?: string | null
          content?: string
          attachments?: string[]
          mentions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: ActivityType
          agent_id: string | null
          task_id: string | null
          message: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          type: ActivityType
          agent_id?: string | null
          task_id?: string | null
          message: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          type?: ActivityType
          agent_id?: string | null
          task_id?: string | null
          message?: string
          metadata?: Json
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string
          type: DocumentType
          task_id: string | null
          created_by: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type: DocumentType
          task_id?: string | null
          created_by: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: DocumentType
          task_id?: string | null
          created_by?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          mentioned_agent_id: string
          from_agent_id: string | null
          task_id: string | null
          message_id: string | null
          content: string
          delivered: boolean
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          mentioned_agent_id: string
          from_agent_id?: string | null
          task_id?: string | null
          message_id?: string | null
          content: string
          delivered?: boolean
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          mentioned_agent_id?: string
          from_agent_id?: string | null
          task_id?: string | null
          message_id?: string | null
          content?: string
          delivered?: boolean
          read?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          agent_id: string
          task_id: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          task_id: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          task_id?: string
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Agent = Database['public']['Tables']['agents']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskAssignment = Database['public']['Tables']['task_assignments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

// Extended types with relations
export type TaskWithAssignees = Task & {
  assignees: Agent[]
}

export type MessageWithAgent = Message & {
  from_agent: Agent | null
  mentioned_agents: Agent[]
}

export type ActivityWithRelations = Activity & {
  agent: Agent | null
  task: Task | null
}

export type DocumentWithRelations = Document & {
  creator: Agent | null
  task: Task | null
}
