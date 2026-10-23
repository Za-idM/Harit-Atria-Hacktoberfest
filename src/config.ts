import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

function int(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const config = {
  sarvamApiKey: required("SARVAM_API_KEY"),
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL || "gemma-4-31b-it",
  defaultLanguageCode: process.env.DEFAULT_LANGUAGE_CODE || "en-IN",
  voiceReplies: (process.env.VOICE_REPLIES ?? "true") !== "false",

  email: {
    user: required("EMAIL_USER"),
    pass: required("EMAIL_PASS"),
    fromName: process.env.EMAIL_FROM_NAME || "Harit",
    fromAddress: process.env.EMAIL_FROM_ADDRESS || "",
  },

  ownerJid: process.env.OWNER_JID || "",

  replyDelayMin: int("REPLY_DELAY_MIN", 5),
  replyDelayMax: int("REPLY_DELAY_MAX", 15),
  rateLimitPerMin: int("RATE_LIMIT_PER_MIN", 20),
  historyLimit: int("HISTORY_LIMIT", 20),

  botName: process.env.BOT_NAME || "Harit",

  paths: {
    auth: "data/auth",
    db: "data/bot.db",
    profile: "data/profile.md",
  },
} as const;

export type AppConfig = typeof config;
