import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { getRecentChats } from "../memory/chats.js";
import { getHistory } from "../memory/db.js";
import { triageChat, regionalForesight } from "./summarizer.js";
import { getMetric } from "../memory/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

const sessions = new Map<string, number>();
const SESSION_MS = 8 * 60 * 60 * 1000;

function authed(req: Request): boolean {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");
  const issued = sessions.get(token);
  if (!issued) return false;
  if (Date.now() - issued > SESSION_MS) {
    sessions.delete(token);
    return false;
  }
  return true;
}

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { password } = req.body ?? {};
  if (password !== config.dashboard.password) {
    return res.status(401).json({ error: "wrong password" });
  }
  const token = randomUUID();
  sessions.set(token, Date.now());
  res.json({ token });
});

app.get("/api/dashboard/stats", (req: Request, res: Response) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  res.json({
    messages_handled: getMetric("messages_handled"),
    crop_photos: getMetric("crop_photos"),
    voice_notes_sent: getMetric("voice_notes_sent"),
    chats: getRecentChats().length,
    groq_enabled: Boolean(config.groq.apiKey),
  });
});

app.get("/api/chats", (req: Request, res: Response) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  res.json(getRecentChats());
});

app.get("/api/chats/:jid", (req: Request, res: Response) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  res.json({ jid: (req.params.jid as string), messages: getHistory((req.params.jid as string), 100) });
});

app.post("/api/chats/:jid/summary", async (req: Request, res: Response) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  const messages = getHistory((req.params.jid as string), 50).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  if (messages.length === 0) return res.json({ empty: true });
  res.json(await triageChat(messages));
});

app.post("/api/foresight", async (req: Request, res: Response) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  const chats = getRecentChats();
  let digest = "";
  for (const c of chats.slice(0, 20)) {
    const hist = getHistory(c.jid, 20)
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" | ");
    digest += `Chat ${c.jid.slice(0, 12)}: ${hist}\n`;
  }
  if (!digest.trim()) return res.json({ text: "No farmer chats yet.", engine: "local" });
  res.json(await regionalForesight(digest));
});

app.use(express.static(path.join(__dirname, "public")));

export function startDashboard(): void {
  app.listen(config.dashboard.port, () => {
    console.log(
      `[dashboard] http://localhost:${config.dashboard.port} (officer password from OFFICER_PASSWORD; Groq ${config.groq.apiKey ? "ON" : "OFF -> local triage"})`
    );
  });
}
