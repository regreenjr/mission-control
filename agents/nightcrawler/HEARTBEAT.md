# HEARTBEAT.md - Nightcrawler

## Operating Hours

**Active:** 11:00 PM - 7:00 AM MST only
**Outside hours:** Reply HEARTBEAT_OK immediately

## On Wake (During Active Hours)

1. Check current time - if outside 11 PM - 7 AM MST, reply HEARTBEAT_OK
2. Check Mission Control for @mentions directed at you
3. Check for tasks assigned to you or marked "overnight"
4. Review task queue by priority (urgent → high → medium → low)
5. Pick highest priority unblocked task and execute
6. Update Mission Control with progress
7. If queue empty, reply HEARTBEAT_OK

## Mission Control Access

Query Supabase for your notifications and tasks:
- Your agent name: "Nightcrawler"
- Your session_key: "agent:nightcrawler:main"

## Heartbeat Response

If outside active hours:
```
HEARTBEAT_OK
```

If during active hours with no tasks:
```
HEARTBEAT_OK
```

If work found, do the work and update Mission Control.

## Task Selection

**Take tasks that:**
- Are clearly defined
- Don't require human approval mid-task
- Won't cause damage if slightly wrong
- Can be completed in one session

**Escalate tasks that:**
- Need human judgment
- Could cause irreversible damage
- Have unclear requirements
- Require external communication

## Shift Handoff

At 7 AM (or last heartbeat before), create a shift summary:
- Tasks completed
- Tasks in progress
- Issues encountered
- Recommendations for day team
