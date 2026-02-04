#!/bin/bash

# Mission Control - Heartbeat Cron Setup
# This script configures OpenClaw cron jobs for agent heartbeats

set -e

echo "╔════════════════════════════════════════════╗"
echo "║     Mission Control - Cron Setup           ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if OpenClaw is installed
if ! command -v openclaw &> /dev/null; then
    echo "Error: OpenClaw CLI not found."
    echo "Install it with: npm install -g openclaw@latest"
    exit 1
fi

# Heartbeat message templates
ATLAS_MESSAGE="Check Mission Control. Review assigned tasks, scan for @mentions, check activity feed. If nothing needs action, reply HEARTBEAT_OK."

SCOUT_MESSAGE="Check Mission Control for research tasks. Review notifications, continue any in-progress research, deliver completed findings. If nothing to do, reply HEARTBEAT_OK."

SCRIBE_MESSAGE="Check Mission Control for writing tasks. Review notifications, continue any in-progress writing, submit completed drafts for review. If nothing to do, reply HEARTBEAT_OK."

echo "═══════════════════════════════════════════════"
echo " Removing Existing Cron Jobs"
echo "═══════════════════════════════════════════════"
echo ""

# Remove existing crons if they exist
for name in atlas-heartbeat scout-heartbeat scribe-heartbeat; do
    if openclaw cron list 2>/dev/null | grep -q "$name"; then
        echo "[Remove] $name"
        openclaw cron remove --name "$name" 2>/dev/null || true
    fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo " Creating Heartbeat Cron Jobs"
echo "═══════════════════════════════════════════════"
echo ""

# Atlas (Lead) - wakes at :00, :15, :30, :45
echo "[Create] atlas-heartbeat"
echo "         Schedule: 0,15,30,45 * * * *"
echo "         Session: agent:lead:main"
openclaw cron add \
    --name "atlas-heartbeat" \
    --cron "0,15,30,45 * * * *" \
    --session "isolated" \
    --session-key "agent:lead:main" \
    --message "$ATLAS_MESSAGE" \
    2>/dev/null || echo "         Warning: Could not create cron"
echo ""

# Scout (Researcher) - wakes at :02, :17, :32, :47
echo "[Create] scout-heartbeat"
echo "         Schedule: 2,17,32,47 * * * *"
echo "         Session: agent:researcher:main"
openclaw cron add \
    --name "scout-heartbeat" \
    --cron "2,17,32,47 * * * *" \
    --session "isolated" \
    --session-key "agent:researcher:main" \
    --message "$SCOUT_MESSAGE" \
    2>/dev/null || echo "         Warning: Could not create cron"
echo ""

# Scribe (Writer) - wakes at :04, :19, :34, :49
echo "[Create] scribe-heartbeat"
echo "         Schedule: 4,19,34,49 * * * *"
echo "         Session: agent:writer:main"
openclaw cron add \
    --name "scribe-heartbeat" \
    --cron "4,19,34,49 * * * *" \
    --session "isolated" \
    --session-key "agent:writer:main" \
    --message "$SCRIBE_MESSAGE" \
    2>/dev/null || echo "         Warning: Could not create cron"
echo ""

echo "═══════════════════════════════════════════════"
echo " Verifying Cron Jobs"
echo "═══════════════════════════════════════════════"
echo ""

echo "[Verify] Current OpenClaw cron jobs:"
openclaw cron list 2>/dev/null || echo "Could not list cron jobs"

echo ""
echo "═══════════════════════════════════════════════"
echo " Heartbeat Schedule"
echo "═══════════════════════════════════════════════"
echo ""
echo "Every 15 minutes, agents wake up in this order:"
echo ""
echo "  :00  Atlas (Lead) - Reviews all tasks, coordinates"
echo "  :02  Scout (Researcher) - Handles research tasks"
echo "  :04  Scribe (Writer) - Handles writing tasks"
echo ""
echo "  :15  Atlas"
echo "  :17  Scout"
echo "  :19  Scribe"
echo ""
echo "  ... and so on every 15 minutes"
echo ""
echo "This staggered schedule ensures agents don't"
echo "compete for resources and can hand off work."
echo ""
echo "Done!"
