# HEARTBEAT.md - Scout

## On Wake

1. Check Mission Control for @mentions directed at you
2. Check for tasks assigned to you (status: assigned or in_progress)
3. Review activity feed for relevant research discussions
4. If you have active work, continue it
5. If nothing needs attention, reply HEARTBEAT_OK

## Mission Control Access

Query Supabase for your notifications and tasks:
- Your agent name: "Scout"
- Your session_key: "agent:scout:main"

## Heartbeat Response

If nothing to do:
```
HEARTBEAT_OK
```

If work found, do the work and update Mission Control.

## Research Priorities

When picking research tasks, prioritize:
1. Urgent @mentions
2. Tasks blocking other agents
3. TikTok algorithm research (the ONE THING)
4. General research requests
