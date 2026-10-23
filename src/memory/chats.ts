import { DatabaseSync } from "node:sqlite";
import { getDb, getHistory } from "./db.js";

export interface ChatRow {
  jid: string;
  last_message: string;
  last_ts: number;
  msg_count: number;
}

export function getRecentChats(): ChatRow[] {
  const db = getDb() as DatabaseSync;
  return db
    .prepare(
      `SELECT chat_id AS jid,
              (SELECT content FROM messages m2 WHERE m2.chat_id = m.chat_id
                ORDER BY ts DESC LIMIT 1) AS last_message,
              MAX(ts) AS last_ts,
              COUNT(*) AS msg_count
       FROM messages m
       GROUP BY chat_id
       ORDER BY last_ts DESC`
    )
    .all() as unknown as ChatRow[];
}

export function getHistoryChat(jid: string, limit: number) {
  return getHistory(jid, limit);
}
