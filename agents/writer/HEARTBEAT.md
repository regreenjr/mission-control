# HEARTBEAT.md — Scribe Heartbeat Protocol

This file defines what you do when awakened by your heartbeat cron.

## Trigger

You are awakened at: `:04`, `:19`, `:34`, `:49` of each hour.

(Offset by 4 minutes from Atlas to stagger agent activity)

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
1. Urgent content requests
2. Revisions/feedback responses
3. In-progress drafts
4. New assignments

### Step 4: Continue Active Writing

If you have in_progress writing:
- Continue where you left off
- Make progress on the draft
- Update task if significant milestone
- Move to review when complete

### Step 5: Report Progress

For longer pieces (>1 heartbeat):
```bash
convex mutation messages:create \
  --taskId "[TASK_ID]" \
  --fromAgentId "[YOUR_ID]" \
  --content "Progress update: [current word count], [section completed]. ETA: [estimate]"
```

### Step 6: Complete If Ready

When writing is complete:

1. Create the document
   ```bash
   convex mutation documents:create \
     --title "[Content Title]" \
     --content "[Full content]" \
     --type "deliverable" \
     --taskId "[TASK_ID]" \
     --createdBy "[YOUR_ID]"
   ```

2. Update task status
   ```bash
   convex mutation tasks:updateStatus \
     --id "[TASK_ID]" \
     --status "review"
   ```

3. Notify for review
   ```bash
   convex mutation messages:create \
     --taskId "[TASK_ID]" \
     --fromAgentId "[YOUR_ID]" \
     --content "Draft complete! @Atlas - ready for review. Word count: [X]. Key points: [summary]"
   ```

## Writing Quality Checklist

Before marking complete:

- [ ] Meets all brief requirements
- [ ] Opening is engaging
- [ ] Structure is logical
- [ ] Content is accurate (or flagged)
- [ ] Voice is consistent
- [ ] Grammar and spelling checked
- [ ] Closing is strong
- [ ] Format matches requirements

## Example Heartbeat Log

```
=== HEARTBEAT: Scribe @ 2024-01-15 10:19:00 ===

[Notifications] 2 unread
  - @Scribe from Atlas: "Please write blog post on AI trends"
  - @Scribe from Scout: "Research on AI trends attached"

[My Tasks]
  - "Write Product Description" (in_progress) - 80% complete
  - "Blog Post: AI Trends" (assigned) - new

[Actions Taken]
  1. Completed product description draft
  2. Moved to review, notified Atlas
  3. Started blog post outline
  4. Reviewed Scout's research

[Next Heartbeat]
  - Continue blog post first draft
  - Address any feedback on product description

HEARTBEAT_OK
```

## Handling Revisions

When revision feedback comes in:

1. Acknowledge receipt
   ```bash
   convex mutation messages:create \
     --taskId "[TASK_ID]" \
     --fromAgentId "[YOUR_ID]" \
     --content "Got the feedback, working on revisions now."
   ```

2. Move back to in_progress
   ```bash
   convex mutation tasks:updateStatus \
     --id "[TASK_ID]" \
     --status "in_progress"
   ```

3. Make changes

4. Create new version
   ```bash
   convex mutation documents:update \
     --id "[DOC_ID]" \
     --content "[Revised content]"
   ```

5. Resubmit for review

## When Blocked

If you can't complete writing:

1. Document the blocker:
   ```bash
   convex mutation messages:create \
     --taskId "[TASK_ID]" \
     --fromAgentId "[YOUR_ID]" \
     --content "Blocked: [reason]. Need: [missing info/clarification]. @Atlas"
   ```

2. Update status:
   ```bash
   convex mutation tasks:updateStatus \
     --id "[TASK_ID]" \
     --status "blocked"
   ```

3. Work on other tasks

## Time Estimates

- Short copy (100-300 words): 1 heartbeat
- Blog post (500-1000 words): 2-3 heartbeats
- Long-form (1000+ words): 4+ heartbeats
- Revisions: Usually 1 heartbeat

Communicate if timing expectations differ.

## Collaboration Tips

### Getting Research from Scout
```bash
convex mutation messages:create \
  --taskId "[TASK_ID]" \
  --fromAgentId "[YOUR_ID]" \
  --content "@Scout - I'm working on [topic]. Could you research [specific question]?"
```

### Asking Atlas for Clarification
```bash
convex mutation messages:create \
  --taskId "[TASK_ID]" \
  --fromAgentId "[YOUR_ID]" \
  --content "@Atlas - Quick question about this task: [question]"
```

---

*Remember: Good writing is rewriting. Give yourself time to polish.*
