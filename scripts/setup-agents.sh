#!/bin/bash

# Mission Control - Agent Setup Script
# This script initializes OpenClaw sessions for each agent

set -e

echo "╔════════════════════════════════════════════╗"
echo "║     Mission Control - Agent Setup          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if OpenClaw is installed
if ! command -v openclaw &> /dev/null; then
    echo "Error: OpenClaw CLI not found."
    echo "Install it with: npm install -g openclaw@latest"
    exit 1
fi

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS_DIR="$PROJECT_ROOT/agents"

echo "[Info] Project root: $PROJECT_ROOT"
echo "[Info] Agents directory: $AGENTS_DIR"
echo ""

# Function to setup an agent
setup_agent() {
    local name=$1
    local session_key=$2
    local workspace=$3

    echo "[Setup] Agent: $name"
    echo "        Session: $session_key"
    echo "        Workspace: $workspace"

    # Check if session already exists
    if openclaw sessions list 2>/dev/null | grep -q "$session_key"; then
        echo "        Status: Session already exists"
    else
        echo "        Status: Creating new session..."
        # Note: The exact openclaw command may vary based on version
        # This is a template - adjust based on your OpenClaw version
        openclaw sessions create \
            --session-key "$session_key" \
            --workspace "$workspace" \
            2>/dev/null || echo "        Warning: Could not create session (may already exist)"
    fi
    echo ""
}

echo "═══════════════════════════════════════════════"
echo " Setting up Agent Sessions"
echo "═══════════════════════════════════════════════"
echo ""

# Setup Atlas (Squad Lead)
setup_agent "Atlas (Lead)" "agent:lead:main" "$AGENTS_DIR/lead"

# Setup Scout (Researcher)
setup_agent "Scout (Researcher)" "agent:researcher:main" "$AGENTS_DIR/researcher"

# Setup Scribe (Writer)
setup_agent "Scribe (Writer)" "agent:writer:main" "$AGENTS_DIR/writer"

echo "═══════════════════════════════════════════════"
echo " Verifying Sessions"
echo "═══════════════════════════════════════════════"
echo ""

# List all sessions
echo "[Verify] Current OpenClaw sessions:"
openclaw sessions list 2>/dev/null || echo "Could not list sessions"

echo ""
echo "═══════════════════════════════════════════════"
echo " Next Steps"
echo "═══════════════════════════════════════════════"
echo ""
echo "1. Configure OpenClaw with your API keys:"
echo "   openclaw config set --key ANTHROPIC_API_KEY --value 'your-key'"
echo ""
echo "2. Set up Slack integration (optional):"
echo "   openclaw channel add slack --token 'xoxb-your-token'"
echo ""
echo "3. Start the OpenClaw gateway:"
echo "   openclaw gateway start"
echo ""
echo "4. Run the heartbeat cron setup:"
echo "   ./scripts/setup-crons.sh"
echo ""
echo "5. Seed the Convex database with agents:"
echo "   npx convex run agents:seed"
echo ""
echo "Done!"
