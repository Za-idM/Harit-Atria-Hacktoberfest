import { config, assertRuntimeConfig } from "./config.js";
import { startDashboard } from "./dashboard/server.js";
import { startWhatsApp, sendFromScheduler } from "./whatsapp.js";
import { startScheduler, stopScheduler } from "./reminders/scheduler.js";
import { closeDb } from "./memory/db.js";

function bootCheck(): void {
  console.log(`[harit] model: ${config.geminiModel}`);
  console.log(`[harit] owner: ${config.ownerJid ? "configured" : "NOT SET"}`);
  console.log(`[harit] voice replies: ${config.voiceReplies}`);
}

let shuttingDown = false;

async function main(): Promise<void> {
  assertRuntimeConfig();
  bootCheck();
  startDashboard();
  startScheduler(async (jid, text) => sendFromScheduler(jid, text));
  await startWhatsApp(() => {});
}

process.on("SIGINT", async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\n[harit] Shutting down gracefully...");
  stopScheduler();
  closeDb();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopScheduler();
  closeDb();
  process.exit(0);
});

main().catch((e) => {
  console.error("[harit] Fatal boot error:", e);
  process.exit(1);
});
