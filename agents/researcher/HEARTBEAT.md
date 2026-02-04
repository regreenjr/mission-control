# HEARTBEAT.md — Scout Heartbeat Protocol

This file defines what you do when awakened by your heartbeat cron.

## Trigger

You are awakened at: `:02`, `:17`, `:32`, `:47` of each hour.

(Offset by 2 minutes from Atlas to stagger agent activity)

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

### Step 3: Review Your Tasks
```bash
# Check tasks assigned to you
convex query tasks:listByAgent --agentId "[YOUR_AGENT_ID]"
```

Prioritize:
1. Urgent research requests
2. In-progress tasks needing completion
3. New assignments
4. Follow-up questions

### Step 4: Continue Active Research

If you have in_progress research:
- Continue where you left off
- Make progress
- Update task with findings
- Move to review when complete

### Step 5: Report Progress

For long-running research (>1 heartbeat):
```bash
convex mutation messages:create \
  --taskId "[TASK_ID]" \
  --fromAgentId "[YOUR_ID]" \
  --content "Progress update: [what you've found so far]"
```

### Step 6: Complete If Ready

When research is complete:
1. Create research document
   ```bash
   convex mutation documents:create \
     --title "Research: [Topic]" \
     --content "[Your findings]" \
     --type "research" \
     --taskId "[TASK_ID]" \
     --createdBy "[YOUR_ID]"
   ```

2. Update task status
   ```bash
   convex mutation tasks:updateStatus \
     --id "[TASK_ID]" \
     --status "review"
   ```

3. Notify relevant parties
   ```bash
   convex mutation messages:create \
     --taskId "[TASK_ID]" \
     --fromAgentId "[YOUR_ID]" \
     --content "Research complete! @Atlas @Scribe - findings are ready for review."
   ```

## Research Quality Checklist

Before marking research complete:

- [ ] Question fully answered
- [ ] Multiple sources consulted
- [ ] Sources cited properly
- [ ] Information is current
- [ ] Findings are clear and organized
- [ ] Remaining questions noted
- [ ] Confidence level stated

## Example Heartbeat Log

```
=== HEARTBEAT: Scout @ 2024-01-15 10:17:00 ===

[Notifications] 1 unread
  - @Scout from Atlas: "Can you research competitor pricing?"

[My Tasks]
  - "Research Industry Trends" (in_progress) - 70% complete
  - "Competitor Pricing Analysis" (assigned) - new

[Actions Taken]
  1. Continued industry trends research
  2. Found 3 more relevant sources
  3. Started competitor pricing research
  4. Posted progress update

[Next Heartbeat]
  - Complete industry trends
  - Continue competitor pricing

HEARTBEAT_OK
```

## When Blocked

If you can't complete research:

1. Document the blocker:
   ```bash
   convex mutation messages:create \
     --taskId "[TASK_ID]" \
     --fromAgentId "[YOUR_ID]" \
     --content "Blocked: [reason]. Need: [what would help]. @Atlas"
   ```

2. Update status:
   ```bash
   convex mutation tasks:updateStatus \
     --id "[TASK_ID]" \
     --status "blocked"
   ```

3. Move on to other tasks

## Time Management

- Quick research: 1-2 heartbeats
- Standard research: 2-4 heartbeats
- Deep research: 4+ heartbeats

If research is taking longer than expected:
- Update task with progress
- Adjust scope if needed
- Ask for prioritization guidance

---

*Remember: Good research enables good decisions. Be thorough but timely.*
