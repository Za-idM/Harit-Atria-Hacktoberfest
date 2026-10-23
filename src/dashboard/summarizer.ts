import { config } from "../config.js";

export interface TriageSummary {
  concern: string;
  advice: string;
  status: "Alerting" | "Noteworthy" | "Routine";
  crop: string;
  issueType: string;
  engine: "groq" | "local";
}

const ALERTING =
  /(poison|toxic|overdos|emergency|died|dying|destroyed|swarm|outbreak|burn)/i;
const NOTEWORTHY =
  /(scheme|kisan|subsid|drought|irrigat|urea|fertiliz|pesticide|dose|dosage|reminder)/i;

const STATUS_RULES: [RegExp, TriageSummary["status"]][] = [
  [ALERTING, "Alerting"],
  [NOTEWORTHY, "Noteworthy"],
];

export function localTriage(messages: { role: string; content: string }[]): TriageSummary {
  const joined = messages.map((m) => m.content).join(" ");
  const userMsgs = messages.filter((m) => m.role === "user");
  const botMsgs = messages.filter((m) => m.role === "assistant");
  const concern = (userMsgs[userMsgs.length - 1]?.content ?? joined.slice(0, 120)).slice(0, 200);
  const advice = (botMsgs[botMsgs.length - 1]?.content ?? "No advice yet").slice(0, 200);
  const status = STATUS_RULES.find(([re]) => re.test(joined))?.[1] ?? "Routine";
  const crop =
    joined.match(
      /(tomato|mango|paddy|rice|wheat|cotton|maize|ragi|banana|groundnut|sugarcane|chilli|onion|potato|soybean|gram)/i
    )?.[1] ?? "unknown";
  const issueType =
    joined.match(/(pest|disease|fungus|irrigation|fertilizer|scheme|price|seed|weather)/i)?.[1] ??
    "general";
  return { concern, advice, status, crop, issueType, engine: "local" };
}

const SYSTEM = `You analyze farmer-helpline chat logs for a government agriculture officer.
Reply with ONLY minified JSON, no markdown:
{"concern":"<farmer's core problem, 1-2 sentences>","advice":"<key advice Harit gave, 1-2 sentences>","status":"Alerting|Noteworthy|Routine","crop":"<crop or unknown>","issueType":"<pest|disease|irrigation|fertilizer|scheme|price|seed|weather|general>"}
Alerting = severe outbreak, toxicity risk, emergency. Noteworthy = schemes, drought, dosage/fertilizer management. Routine = standard advice.`;

export async function triageChat(
  messages: { role: string; content: string }[]
): Promise<TriageSummary> {
  const apiKey = config.groq.apiKey;
  if (!apiKey) return localTriage(messages);
  try {
    const transcript = messages
      .slice(-30)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.groq.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: transcript },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data: any = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      concern: String(json.concern ?? "").slice(0, 300),
      advice: String(json.advice ?? "").slice(0, 300),
      status: ["Alerting", "Noteworthy", "Routine"].includes(json.status)
        ? json.status
        : "Routine",
      crop: String(json.crop ?? "unknown").slice(0, 40),
      issueType: String(json.issueType ?? "general").slice(0, 30),
      engine: "groq",
    };
  } catch (e: any) {
    console.warn(`[summarizer] Groq failed (${String(e?.message ?? e).slice(0, 80)}); using local triage.`);
    return localTriage(messages);
  }
}

const FORESIGHT_SYSTEM = `You are an agriculture extension analyst. From recent farmer-helpline queries across a region, write a tight executive briefing (<200 words) with sections: Pest/Disease Hotspots; Irrigation & Weather Stress; Input Misuse; Recommended Extension Actions. Plain text.`;

export async function regionalForesight(chatDigest: string): Promise<{ text: string; engine: "groq" | "local" }> {
  if (!config.groq.apiKey) {
    return {
      text: `Local fallback (no GROQ_API_KEY):\n\nRecent query themes (keyword counts):\n${chatDigest.slice(0, 800)}\n\nRecommended: review Alerting chats first in the chat inspector.`,
      engine: "local",
    };
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.groq.apiKey}`,
      },
      body: JSON.stringify({
        model: config.groq.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: FORESIGHT_SYSTEM },
          { role: "user", content: chatDigest.slice(0, 12000) },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data: any = await res.json();
    return { text: data.choices?.[0]?.message?.content ?? "", engine: "groq" };
  } catch (e: any) {
    console.warn(`[summarizer] foresight Groq failed; local fallback.`);
    return {
      text: `Groq unavailable. Query themes:\n${chatDigest.slice(0, 800)}`,
      engine: "local",
    };
  }
}
