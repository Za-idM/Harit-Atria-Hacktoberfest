import dotenv from "dotenv";

dotenv.config();

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function int(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const config = {
  sarvamApiKey: env("SARVAM_API_KEY"),
  geminiApiKey: env("GEMINI_API_KEY"),
  geminiModel: env("GEMINI_MODEL", "gemma-4-31b-it"),
  geminiFallbackModel: env("GEMINI_FALLBACK_MODEL", "gemma-4-26b-a4b-it"),
  defaultLanguageCode: env("DEFAULT_LANGUAGE_CODE", "en-IN"),
  voiceReplies: (env("VOICE_REPLIES", "true")) !== "false",

  email: {
    user: env("EMAIL_USER"),
    pass: env("EMAIL_PASS"),
    fromName: env("EMAIL_FROM_NAME", "Harit"),
    fromAddress: env("EMAIL_FROM_ADDRESS"),
  },

  ownerJid: env("OWNER_JID"),

  groq: {
    apiKey: env("GROQ_API_KEY"),
    model: env("GROQ_MODEL", "llama-3.3-70b-versatile"),
  },

  dashboard: {
    port: int("DASHBOARD_PORT", 3000),
    password: env("OFFICER_PASSWORD", "harit2026"),
  },

  replyDelayMin: int("REPLY_DELAY_MIN", 5),
  replyDelayMax: int("REPLY_DELAY_MAX", 15),
  rateLimitPerMin: int("RATE_LIMIT_PER_MIN", 20),
  historyLimit: int("HISTORY_LIMIT", 20),

  botName: env("BOT_NAME", "Harit"),

  paths: {
    auth: "data/auth",
    db: "data/bot.db",
    profile: "data/profile.md",
  },
} as const;

export type AppConfig = typeof config;

export function assertRuntimeConfig(): void {
  const missing: string[] = [];
  if (!config.sarvamApiKey) missing.push("SARVAM_API_KEY");
  if (!config.geminiApiKey) missing.push("GEMINI_API_KEY");
  if (!config.email.user || !config.email.pass) missing.push("EMAIL_USER/EMAIL_PASS");
  if (missing.length > 0) {
    console.error(`[config] Missing env vars: ${missing.join(", ")}`);
    console.error("[config] Copy .env.example to .env and fill in the keys.");
    process.exit(1);
  }
}
