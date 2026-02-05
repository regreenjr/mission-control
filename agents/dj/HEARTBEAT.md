# HEARTBEAT.md - DJ

## On Wake

1. Check Mission Control for @mentions directed at you
2. Check for tasks assigned to you (status: assigned or in_progress)
3. Check running processes for errors or completion
4. Review any build/deployment logs
5. If you have active work, continue it
6. If nothing needs attention, reply HEARTBEAT_OK

## Mission Control Access

Query Supabase for your notifications and tasks:
- Your agent name: "DJ"
- Your session_key: "agent:dj:main"

## Heartbeat Response

If nothing to do:
```
HEARTBEAT_OK
```

If work found, do the work and update Mission Control.

## Task Priorities

When picking tasks, prioritize:
1. Broken things (errors, failed processes)
2. Urgent @mentions
3. Tasks blocking other agents
4. New build requests
5. Improvements/optimizations
