import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  _db = new DatabaseSync(config.paths.db);
  _db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_call_id TEXT,
      tool_name TEXT,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_chat_ts ON messages(chat_id, ts DESC);

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      cron_expr TEXT,
      fire_at INTEGER,
      message TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_ts INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farmer_profiles (
      jid TEXT PRIMARY KEY,
      language_code TEXT NOT NULL DEFAULT 'en-IN',
      profile_json TEXT NOT NULL DEFAULT '{}',
      updated_ts INTEGER NOT NULL
    );
  `);
  return _db;
}

export interface StoredMessage {
  id: number;
  chat_id: string;
  role: string;
  content: string;
  tool_call_id: string | null;
  tool_name: string | null;
  ts: number;
}

export function saveMessage(
  msg: Omit<StoredMessage, "id" | "ts">
): void {
  getDb()
    .prepare(
      `INSERT INTO messages (chat_id, role, content, tool_call_id, tool_name, ts)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      msg.chat_id,
      msg.role,
      msg.content,
      msg.tool_call_id,
      msg.tool_name,
      Date.now()
    );
}

export function getHistory(chatId: string, limit: number): StoredMessage[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM messages WHERE chat_id = ? ORDER BY ts DESC, id DESC LIMIT ?`
    )
    .all(chatId, limit) as unknown as StoredMessage[];
  return rows.reverse();
}

export interface FarmerProfile {
  jid: string;
  language_code: string;
  profile_json: string;
  updated_ts: number;
}

export function getFarmerProfile(jid: string): FarmerProfile | null {
  const row = getDb()
    .prepare(`SELECT * FROM farmer_profiles WHERE jid = ?`)
    .get(jid) as unknown as FarmerProfile | undefined;
  return row ?? null;
}

export function saveFarmerLanguage(jid: string, languageCode: string): void {
  getDb()
    .prepare(
      `INSERT INTO farmer_profiles (jid, language_code, profile_json, updated_ts)
       VALUES (?, ?, '{}', ?)
       ON CONFLICT(jid) DO UPDATE SET language_code = excluded.language_code, updated_ts = excluded.updated_ts`
    )
    .run(jid, languageCode, Date.now());
}

export function mergeFarmerProfile(
  jid: string,
  patch: Record<string, string>
): string {
  const existing = getFarmerProfile(jid);
  const current: Record<string, string> = existing
    ? JSON.parse(existing.profile_json || "{}")
    : {};
  const merged = { ...current, ...patch };
  getDb()
    .prepare(
      `INSERT INTO farmer_profiles (jid, language_code, profile_json, updated_ts)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(jid) DO UPDATE SET profile_json = excluded.profile_json, updated_ts = excluded.updated_ts`
    )
    .run(
      jid,
      existing?.language_code ?? "en-IN",
      JSON.stringify(merged),
      Date.now()
    );
  return JSON.stringify(merged);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
