import { config } from "./config.js";

function boot(): void {
  const checks: string[] = [
    `model: ${config.geminiModel}`,
    `owner: ${config.ownerJid ? "configured" : "MISSING"}`,
    `sarvam key: ${config.sarvamApiKey ? "configured" : "MISSING"}`,
    `gemini key: ${config.geminiApiKey ? "configured" : "MISSING"}`,
    `voice replies: ${config.voiceReplies}`,
  ];
  console.log("[harit] boot");
  for (const line of checks) {
    console.log(`[harit] ${line}`);
  }
}

boot();
