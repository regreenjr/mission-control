import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Agent session mappings
const AGENT_SESSIONS: Record<string, string> = {
  atlas: "agent:lead:main",
  scout: "agent:researcher:main",
  scribe: "agent:writer:main",
};

// Polling interval (in milliseconds)
const POLL_INTERVAL = 2000;

// Track retry counts for failed deliveries
const retryCount: Map<string, number> = new Map();
const MAX_RETRIES = 5;

interface Notification {
  id: string;
  mentioned_agent_id: string;
  from_agent_id: string | null;
  task_id: string | null;
  content: string;
  delivered: boolean;
}

interface Agent {
  id: string;
  name: string;
  session_key: string;
}

interface Task {
  id: string;
  title: string;
}

/**
 * Format notification content for delivery
 */
function formatNotification(notif: {
  content: string;
  fromAgentName?: string;
  taskTitle?: string;
}): string {
  let message = "";

  if (notif.fromAgentName) {
    message += `[From ${notif.fromAgentName}] `;
  }

  if (notif.taskTitle) {
    message += `[Task: ${notif.taskTitle}] `;
  }

  message += notif.content;

  // Escape special characters for shell
  return message.replace(/"/g, '\\"').replace(/\$/g, "\\$");
}

/**
 * Deliver a notification to an agent via OpenClaw
 */
async function deliverNotification(
  sessionKey: string,
  content: string
): Promise<boolean> {
  try {
    // Using OpenClaw CLI to send message to agent session
    const command = `openclaw sessions send --session "${sessionKey}" --message "${content}"`;

    console.log(`[Delivery] Sending to ${sessionKey}...`);

    await execAsync(command, { timeout: 10000 });

    console.log(`[Delivery] Successfully delivered to ${sessionKey}`);
    return true;
  } catch (error: any) {
    // Agent might be asleep or OpenClaw not running
    if (error.code === 127) {
      console.error("[Error] OpenClaw CLI not found. Is it installed?");
    } else if (error.killed) {
      console.error("[Error] Command timed out");
    } else {
      console.log(
        `[Delivery] Agent ${sessionKey} appears to be asleep, will retry later`
      );
    }
    return false;
  }
}

/**
 * Main polling loop
 */
async function pollNotifications(): Promise<void> {
  try {
    // Fetch undelivered notifications with related data
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(`
        id,
        mentioned_agent_id,
        from_agent_id,
        task_id,
        content,
        delivered
      `)
      .eq("delivered", false);

    if (error) {
      console.error("[Error] Failed to fetch notifications:", error);
      return;
    }

    if (!notifications || notifications.length === 0) {
      return;
    }

    console.log(`[Poll] Found ${notifications.length} undelivered notifications`);

    // Fetch all agents and tasks for enrichment
    const { data: agents } = await supabase.from("agents").select("id, name, session_key");
    const { data: tasks } = await supabase.from("tasks").select("id, title");

    const agentMap = new Map((agents || []).map(a => [a.id, a]));
    const taskMap = new Map((tasks || []).map(t => [t.id, t]));

    for (const notif of notifications) {
      const mentionedAgent = agentMap.get(notif.mentioned_agent_id);

      if (!mentionedAgent?.session_key) {
        console.warn(
          `[Warning] No session key for agent ${notif.mentioned_agent_id}, skipping`
        );
        continue;
      }

      // Check retry count
      const notifId = notif.id;
      const currentRetries = retryCount.get(notifId) || 0;

      if (currentRetries >= MAX_RETRIES) {
        console.log(
          `[Skip] Max retries reached for notification ${notifId}, marking as delivered`
        );
        await supabase
          .from("notifications")
          .update({ delivered: true })
          .eq("id", notifId);
        retryCount.delete(notifId);
        continue;
      }

      // Get from agent and task info
      const fromAgent = notif.from_agent_id ? agentMap.get(notif.from_agent_id) : null;
      const task = notif.task_id ? taskMap.get(notif.task_id) : null;

      // Format and deliver
      const content = formatNotification({
        content: notif.content,
        fromAgentName: fromAgent?.name,
        taskTitle: task?.title,
      });

      const success = await deliverNotification(mentionedAgent.session_key, content);

      if (success) {
        // Mark as delivered in database
        await supabase
          .from("notifications")
          .update({ delivered: true })
          .eq("id", notifId);
        retryCount.delete(notifId);
      } else {
        // Increment retry count
        retryCount.set(notifId, currentRetries + 1);
      }
    }
  } catch (error) {
    console.error("[Error] Failed to poll notifications:", error);
  }
}

/**
 * Cleanup old retry counts periodically
 */
function cleanupRetryCount(): void {
  // Clear retry counts every hour
  retryCount.clear();
  console.log("[Cleanup] Cleared retry counts");
}

/**
 * Graceful shutdown
 */
function shutdown(): void {
  console.log("\n[Shutdown] Stopping notification daemon...");
  process.exit(0);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║     Mission Control Notification Daemon    ║");
  console.log("║              (Supabase Edition)            ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log("");
  console.log(`[Config] Supabase URL: ${SUPABASE_URL}`);
  console.log(`[Config] Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`[Config] Agent sessions:`, Object.keys(AGENT_SESSIONS).join(", "));
  console.log("");
  console.log("[Start] Beginning notification polling...\n");

  // Handle shutdown signals
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Start polling loop
  setInterval(pollNotifications, POLL_INTERVAL);

  // Cleanup retry counts every hour
  setInterval(cleanupRetryCount, 60 * 60 * 1000);

  // Initial poll
  await pollNotifications();
}

main().catch((error) => {
  console.error("[Fatal] Failed to start daemon:", error);
  process.exit(1);
});
