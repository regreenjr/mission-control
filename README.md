# Mission Control: AI Agent Squad System

A multi-agent AI system where multiple AI agents work together like a team, with a shared task database, real-time dashboard, and Slack integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mission Control                          │
│                      (React + Supabase Dashboard)                │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                       │
│   agents | tasks | messages | activities | documents | notifs    │
│                     + Realtime Subscriptions                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│    OpenClaw Gateway      │    │    Notification Daemon (Node.js) │
│   (Agent Orchestrator)   │    │    - Polls for @mentions         │
│                          │    │    - Delivers to agent sessions  │
│  Session: agent:lead     │    └──────────────────────────────────┘
│  Session: agent:research │
│  Session: agent:writer   │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│         Slack            │
│   (Human Interface)      │
└──────────────────────────┘
```

## Agent Roster

| Agent | Role | Specialty |
|-------|------|-----------|
| **Atlas** | Squad Lead | Coordination, delegation, human interface |
| **Scout** | Researcher | Deep research, source evaluation, synthesis |
| **Scribe** | Content Writer | Writing, editing, content creation |

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys from Settings > API

### 2. Run the Database Migration

In your Supabase dashboard, go to **SQL Editor** and run the migration:

```bash
# Copy the contents of supabase/migrations/001_initial_schema.sql
# and paste into the SQL Editor, then click "Run"
```

Or using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Install Dependencies

```bash
cd mission-control
npm install

# Install workspace dependencies
cd apps/dashboard && npm install && cd ../..
cd apps/notification-daemon && npm install && cd ../..
```

### 4. Configure Environment Variables

Create `apps/dashboard/.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Create `apps/notification-daemon/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

> **Note:** The dashboard uses the public anon key (safe for frontend). The notification daemon uses the service role key (keep secret, server-side only).

### 5. Seed the Database

Option A: Use the Dashboard UI
- Open the dashboard at http://localhost:5173
- Click "Seed Agents" button to create the initial agent roster

Option B: Run SQL directly in Supabase:
```sql
INSERT INTO agents (name, role, session_key, status, level) VALUES
  ('Atlas', 'Squad Lead', 'agent:lead:main', 'idle', 'lead'),
  ('Scout', 'Researcher', 'agent:researcher:main', 'idle', 'specialist'),
  ('Scribe', 'Content Writer', 'agent:writer:main', 'idle', 'specialist');
```

### 6. Start the Dashboard

```bash
cd apps/dashboard
npm run dev
```

Open http://localhost:5173

### 7. Set Up Agents (Optional)

If you have OpenClaw installed:

```bash
# Set up agent sessions
./scripts/setup-agents.sh

# Set up heartbeat crons
./scripts/setup-crons.sh

# Start the notification daemon
cd apps/notification-daemon
npm run dev
```

## Project Structure

```
mission-control/
├── apps/
│   ├── dashboard/              # React + Vite + TailwindCSS
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── TaskBoard.tsx       # Kanban board
│   │   │   │   ├── AgentCards.tsx      # Agent status cards
│   │   │   │   ├── ActivityFeed.tsx    # Real-time activity
│   │   │   │   ├── TaskDetail.tsx      # Task details + comments
│   │   │   │   ├── DocumentPanel.tsx   # Document management
│   │   │   │   └── DailyStandup.tsx    # Daily summary
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts         # Supabase client
│   │   │   │   ├── hooks.ts            # React hooks with realtime
│   │   │   │   └── database.types.ts   # TypeScript types
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── notification-daemon/    # Node.js @mention delivery
│       ├── src/index.ts
│       └── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # Database schema
│
├── agents/                     # Agent configurations
│   ├── AGENTS.md              # Shared operating manual
│   ├── lead/
│   │   ├── SOUL.md            # Atlas personality
│   │   └── HEARTBEAT.md       # Heartbeat protocol
│   ├── researcher/
│   │   ├── SOUL.md            # Scout personality
│   │   └── HEARTBEAT.md
│   └── writer/
│       ├── SOUL.md            # Scribe personality
│       └── HEARTBEAT.md
│
├── scripts/
│   ├── setup-agents.sh        # Initialize OpenClaw agents
│   └── setup-crons.sh         # Configure heartbeat crons
│
├── package.json
└── turbo.json                  # Monorepo config
```

## Dashboard Features

### Task Board
- Kanban-style task management
- Drag-and-drop between columns
- Priority-based color coding
- Agent assignment

### Agent Cards
- Real-time agent status
- Current task display
- Last heartbeat timestamp

### Activity Feed
- Live activity stream
- Filtered by type
- Agent attribution

### Task Detail
- Full task view
- Comments with @mentions
- Document attachments
- Status updates

### Documents
- Document library
- Type filtering
- Search functionality
- Version tracking

### Daily Standup
- 24-hour summary
- Per-agent stats
- Team health metrics

## Database Schema

### Tables
- `agents` - Agent definitions and status
- `tasks` - Task management with priority/status
- `task_assignments` - Many-to-many task assignments
- `messages` - Comments on tasks with @mentions
- `activities` - Activity feed events
- `documents` - Deliverables and notes
- `notifications` - @mention delivery queue
- `subscriptions` - Thread subscriptions

### Realtime
All tables publish changes via Supabase Realtime. The dashboard automatically subscribes to updates for live data.

## React Hooks

The dashboard uses custom hooks with Supabase integration:

```typescript
// Agents
useAgents()              // All agents with realtime updates
useAgent(id)             // Single agent

// Tasks
useTasks()               // All tasks
useTasksGrouped()        // Tasks grouped by status (Kanban)
useTask(id)              // Single task with details
useTaskAssignees(id)     // Agents assigned to task

// Messages
useMessages(taskId)      // Task comments with realtime

// Activity
useActivities()          // Activity feed

// Documents
useDocuments()           // All documents
useDocument(id)          // Single document
useDocumentsByTask(id)   // Documents for a task

// Daily Summary
useDailySummary()        // 24-hour stats

// Mutations
useMutations()           // Returns mutation functions:
  - seedAgents()
  - updateAgentStatus(id, status)
  - recordHeartbeat(id)
  - createTask({...})
  - updateTaskStatus(id, status)
  - assignTask(id, agentIds)
  - createMessage({...})
  - createDocument({...})
```

## Heartbeat Schedule

Agents wake every 15 minutes in a staggered pattern:

| Time | Agent | Action |
|------|-------|--------|
| :00 | Atlas | Review tasks, coordinate |
| :02 | Scout | Handle research |
| :04 | Scribe | Handle writing |
| :15 | Atlas | ... |
| :17 | Scout | ... |
| :19 | Scribe | ... |

## Environment Variables

### Dashboard
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Notification Daemon
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

## Development

```bash
# Run everything with Turbo
npm run dev

# Or run individually:

# Dashboard
cd apps/dashboard && npm run dev

# Notification daemon
cd apps/notification-daemon && npm run dev
```

## Supabase Setup Details

### 1. Enable Realtime

In your Supabase dashboard:
1. Go to **Database > Replication**
2. Enable realtime for tables: `agents`, `tasks`, `task_assignments`, `messages`, `activities`, `documents`, `notifications`

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 2. Row Level Security (RLS)

The migration includes RLS policies that allow all operations. For production, you should customize these based on your authentication requirements.

### 3. API Keys

- **anon key** (public): Safe for frontend, respects RLS policies
- **service_role key** (secret): Bypasses RLS, use only server-side

## Slack Integration

1. Create a Slack App at api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `channels:read`, `im:read`, `im:write`
3. Install to workspace
4. Configure OpenClaw:
   ```bash
   openclaw channel add slack --token "xoxb-your-token"
   ```

## Troubleshooting

### "TypeError: supabase.from is not a function"
Make sure your environment variables are set and the Supabase client is properly initialized.

### Realtime not updating
1. Check that tables are added to the `supabase_realtime` publication
2. Verify your Supabase project has realtime enabled
3. Check browser console for WebSocket errors

### Agent not receiving notifications
1. Verify the notification daemon is running
2. Check agent `session_key` matches OpenClaw session
3. Verify notifications are being created in the database

## License

MIT
