-- Mission Control: AI Agent Squad System
-- Initial database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AGENTS TABLE (created first, FK added later)
-- ============================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    session_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'blocked')),
    current_task_id UUID, -- FK added after tasks table
    level TEXT NOT NULL CHECK (level IN ('intern', 'specialist', 'lead')),
    avatar_url TEXT,
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_session_key ON agents(session_key);
CREATE INDEX idx_agents_status ON agents(status);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'assigned', 'in_progress', 'review', 'done', 'blocked')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Add FK from agents to tasks now that tasks exists
ALTER TABLE agents ADD CONSTRAINT fk_agents_current_task
    FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- ============================================
-- TASK ASSIGNMENTS (Many-to-Many)
-- ============================================
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, agent_id)
);

CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_agent ON task_assignments(agent_id);

-- ============================================
-- MESSAGES TABLE (Task Comments)
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    from_human TEXT,
    content TEXT NOT NULL,
    attachments UUID[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('task_created', 'task_updated', 'task_completed', 'message_sent', 'document_created', 'agent_started', 'agent_heartbeat')),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_agent ON activities(agent_id);
CREATE INDEX idx_activities_task ON activities(task_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deliverable', 'research', 'protocol', 'draft', 'note')),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_task ON documents(task_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_creator ON documents(created_by);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentioned_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_agent_undelivered ON notifications(mentioned_agent_id, delivered) WHERE delivered = FALSE;
CREATE INDEX idx_notifications_agent_unread ON notifications(mentioned_agent_id, read) WHERE read = FALSE;

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, task_id)
);

CREATE INDEX idx_subscriptions_agent ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_task ON subscriptions(task_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (Open for now)
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production)
CREATE POLICY "Allow all" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON task_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
