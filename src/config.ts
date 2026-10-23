import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  sarvamApiKey: required("SARVAM_API_KEY"),
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL ?? "gemma-4-31b-it",
  emailUser: process.env.EMAIL_USER ?? "",
  emailPass: process.env.EMAIL_PASS ?? "",
  emailFromName: process.env.EMAIL_FROM_NAME ?? "Harit",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS ?? "",
  ownerJid: process.env.OWNER_JID ?? "",
  defaultLanguageCode: process.env.DEFAULT_LANGUAGE_CODE ?? "en-IN",
  voiceReplies: (process.env.VOICE_REPLIES ?? "true") === "true",
  replyDelayMin: Number(process.env.REPLY_DELAY_MIN ?? 5),
  replyDelayMax: Number(process.env.REPLY_DELAY_MAX ?? 15),
  rateLimitPerMin: Number(process.env.RATE_LIMIT_PER_MIN ?? 20),
  historyLimit: Number(process.env.HISTORY_LIMIT ?? 20),
};
