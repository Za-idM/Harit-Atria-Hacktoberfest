import { getDb } from "../memory/db.js";

export interface StoredReminder {
  id: number;
  chat_id: string;
  cron_expr: string | null;
  fire_at: number | null;
  message: string;
  active: number;
  created_ts: number;
}

export interface SetReminderArgs {
  cron?: string;
  fireAt?: number;
  message: string;
  chatId: string;
}

export function setReminder(args: SetReminderArgs): string {
  if (!args.message?.trim()) {
    return "ERROR: 'message' is required.";
  }
  if (args.cron) {
    const parts = args.cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return "ERROR: 'cron' must be a 5-field Unix cron expression, e.g. '0 6 * * 1-5'.";
    }
  } else if (!args.fireAt) {
    return "ERROR: provide either 'cron' or 'fireAt' (epoch ms).";
  }

  const info = getDb()
    .prepare(
      `INSERT INTO reminders (chat_id, cron_expr, fire_at, message, active, created_ts)
       VALUES (?, ?, ?, ?, 1, ?)`
    )
    .run(args.chatId, args.cron ?? null, args.fireAt ?? null, args.message.trim(), Date.now());

  return `Reminder #${info.lastInsertRowid} saved: "${args.message.trim()}"`;
}

export const setReminderSchema = {
  type: "object" as const,
  properties: {
    cron: {
      type: "string",
      description:
        "5-field Unix cron for recurring reminders, e.g. '0 6 * * 1-5' (weekdays 6am)",
    },
    fireAt: {
      type: "number",
      description: "Epoch milliseconds for a one-shot reminder",
    },
    message: { type: "string", description: "Reminder text for the farmer" },
  },
  required: ["message"],
};

export function setActiveReminders(): StoredReminder[] {
  return getDb()
    .prepare(`SELECT * FROM reminders WHERE active = 1`)
    .all() as unknown as StoredReminder[];
}

export function markReminderDone(id: number): void {
  getDb()
    .prepare(`UPDATE reminders SET active = 0 WHERE id = ?`)
    .run(id);
}
