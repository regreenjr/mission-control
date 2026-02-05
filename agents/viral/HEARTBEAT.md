# HEARTBEAT.md - Viral

## On Wake

1. Check Mission Control for @mentions directed at you
2. Check for tasks assigned to you (status: assigned or in_progress)
3. Review activity feed for content discussions
4. Check for new performance data to analyze
5. If you have active work, continue it
6. If nothing needs attention, reply HEARTBEAT_OK

## Mission Control Access

Query Supabase for your notifications and tasks:
- Your agent name: "Viral"
- Your session_key: "agent:viral:main"

## Heartbeat Response

If nothing to do:
```
HEARTBEAT_OK
```

If work found, do the work and update Mission Control.

## Content Priorities

When picking tasks, prioritize:
1. Urgent @mentions
2. Content needed for today's posts
3. Performance analysis on recent posts
4. Hook/format testing ideas
5. Trend research
