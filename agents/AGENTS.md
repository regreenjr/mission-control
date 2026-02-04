# Mission Control - Agent Operating Manual

This is the shared operating manual for all agents in the Mission Control system.

## Overview

You are part of an AI agent squad working together on tasks. You coordinate through a shared database (Convex) and communicate via @mentions and task comments.

## System Architecture

```
Mission Control Dashboard ←→ Convex Database ←→ Agents (via OpenClaw)
                                    ↓
                          Notification Daemon
                                    ↓
                               Your Session
```

## Your Interface

### Reading from Mission Control

You have access to these Convex functions:

1. **Check your tasks:**
   ```
   convex query tasks:listByAgent --agentId "your-agent-id"
   ```

2. **Check notifications:**
   ```
   convex query notifications:getUnreadForAgent --agentId "your-agent-id"
   ```

3. **Read task comments:**
   ```
   convex query messages:listByTask --taskId "task-id"
   ```

4. **View activity feed:**
   ```
   convex query activities:list --limit 20
   ```

### Writing to Mission Control

1. **Update task status:**
   ```
   convex mutation tasks:updateStatus --id "task-id" --status "in_progress"
   ```

2. **Post a comment:**
   ```
   convex mutation messages:create --taskId "task-id" --fromAgentId "your-id" --content "Your message here"
   ```

3. **Create a document:**
   ```
   convex mutation documents:create --title "Doc Title" --content "..." --type "deliverable" --createdBy "your-id"
   ```

4. **Record heartbeat:**
   ```
   convex mutation agents:heartbeat --id "your-id"
   ```

## Communication Protocol

### @Mentions
- Use `@AgentName` in comments to notify another agent
- Example: `@Scout can you research this topic?`
- The notification daemon will deliver this to Scout's session

### Task Comments
- All task-related communication happens in task comments
- Keep comments clear and actionable
- Tag relevant agents when you need input

### Handoffs
When passing work to another agent:
1. Update the task status
2. Add a detailed comment about what was done and what's needed
3. @mention the receiving agent
4. Unassign yourself if your part is complete

## Task Lifecycle

```
inbox → assigned → in_progress → review → done
                       ↓
                   blocked (if stuck)
```

### Status Meanings
- **inbox**: New task, not yet assigned
- **assigned**: Agent has been assigned but hasn't started
- **in_progress**: Actively being worked on
- **review**: Work complete, needs verification
- **done**: Task complete
- **blocked**: Cannot proceed, needs help

## Heartbeat Protocol

You will be woken periodically by cron. When this happens:

1. Record your heartbeat
2. Check for @mentions and notifications
3. Review assigned tasks
4. Take action or reply HEARTBEAT_OK if nothing to do

## Document Types

- **deliverable**: Final output for stakeholders
- **research**: Research findings and notes
- **protocol**: Process documentation
- **draft**: Work in progress
- **note**: Quick notes and ideas

## Best Practices

1. **Be Responsive**: Check notifications promptly
2. **Communicate Clearly**: Be specific in task comments
3. **Update Status**: Keep task status accurate
4. **Create Documents**: Document important findings
5. **Use @Mentions**: Notify relevant agents when needed
6. **Ask for Help**: Mark tasks as blocked if stuck

## Error Handling

If you encounter issues:
1. Post a comment explaining the problem
2. Set task status to "blocked"
3. @mention the Squad Lead (@Atlas)

## Security Notes

- Never expose Convex URL or API keys
- Don't share session keys between agents
- Keep human-provided secrets confidential

---

*This manual applies to all agents. See your individual SOUL.md for role-specific guidance.*
