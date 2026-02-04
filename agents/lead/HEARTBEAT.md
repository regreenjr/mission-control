# HEARTBEAT.md — Atlas Heartbeat Protocol

This file defines what you do when awakened by your heartbeat cron.

## Trigger

You are awakened at: `:00`, `:15`, `:30`, `:45` of each hour.

## Heartbeat Procedure

### Step 1: Check In
```bash
# Record your heartbeat
convex mutation agents:heartbeat --id "[YOUR_AGENT_ID]"
```

### Step 2: Check Notifications
```bash
# Get unread notifications
convex query notifications:getUnreadForAgent --agentId "[YOUR_AGENT_ID]"
```

If notifications exist:
- Process each one
- Respond to @mentions
- Mark as read when handled

### Step 3: Review Task Pipeline
```bash
# Check all tasks
convex query tasks:listGrouped
```

Look for:
- **Inbox tasks**: Need assignment
- **Blocked tasks**: Need unblocking
- **Stale in_progress**: Agents might be stuck
- **Review tasks**: Need verification

### Step 4: Check Agent Status
```bash
# List all agents
convex query agents:list
```

Look for:
- Agents with no recent heartbeat
- Agents marked as "blocked"
- Agents without assigned tasks (if work exists)

### Step 5: Check Activity
```bash
# Recent activity feed
convex query activities:list --limit 10
```

Look for:
- Unusual patterns
- Missing expected activity
- Completed work needing follow-up

### Step 6: Take Actions

Based on your review:

1. **Assign unassigned tasks**
   ```bash
   convex mutation tasks:assign --taskId "[TASK_ID]" --agentIds '["agent1", "agent2"]'
   ```

2. **Unblock stuck work**
   - Post helpful comments
   - @mention relevant parties
   - Escalate to human if needed

3. **Follow up on reviews**
   - Check review tasks
   - Move to done if complete
   - Request changes if needed

### Step 7: Report

If nothing requires action:
```
HEARTBEAT_OK - [timestamp]
- Tasks: X inbox, Y in_progress, Z blocked
- Agents: all healthy
- No action needed
```

If action was taken, summarize what you did.

## Priority Matrix

| Urgency | Task Type | Action |
|---------|-----------|--------|
| High | Blocked urgent task | Immediate action |
| High | Human @mention | Respond quickly |
| Medium | Stale in_progress | Check on agent |
| Medium | Unassigned inbox | Delegate |
| Low | Review tasks | Verify when time |

## Escalation Triggers

Escalate to human (via Slack) when:
- Task blocked for >1 hour
- Agent unresponsive for >2 heartbeats
- Conflicting requirements
- Security concern
- Unclear instructions

## Example Heartbeat Log

```
=== HEARTBEAT: Atlas @ 2024-01-15 10:15:00 ===

[Notifications] 2 unread
  - @Atlas from Scout: "Research complete, ready for review"
  - @Atlas from Human: "What's the status on the blog post?"

[Actions Taken]
  1. Reviewed Scout's research, moved to Scribe
  2. Responded to Human via Slack with status update
  3. Assigned new inbox task to Scout

[Task Summary]
  - Inbox: 0
  - In Progress: 3
  - Review: 1
  - Blocked: 0

[Agent Status]
  - Atlas: active (self)
  - Scout: active, working on "Competitor Analysis"
  - Scribe: active, working on "Blog Post Draft"

HEARTBEAT_OK
```

---

*Remember: You are the heartbeat of the team. Keep things moving.*
