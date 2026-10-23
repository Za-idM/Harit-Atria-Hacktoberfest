# Harit — WhatsApp Farmer Helpline

Farmers send text, voice notes, or crop photos in any Indian language. Harit replies in the farmer's own language — as text and (often) a voice note.

Built during **Hacktoberfest Hack Day Bengaluru x AWS Student Builder Group** at Atria Institute of Technology (Oct 23, 2026).

## AI model

Harit's brain is **Gemma 4** through the **Gemini API**, used for both query answering and crop-photo diagnosis.

- Exact model id: **`gemma-4-31b-it`** (default, set via `GEMINI_MODEL` in `.env`)
- Integration point: [`src/agent.ts`](src/agent.ts) — `ai.models.generateContent(...)` with function-calling tools and multimodal (image) input; uses `@google/genai`
- If the endpoint rejects function calling, the agent automatically retries in plain-text mode instead of crashing (see `toolsSupported` fallback in `src/agent.ts`)
- Language work (detection, translation, STT, TTS) is handled by Sarvam AI APIs

## Pipeline

```
Farmer (text / voice note / crop photo, any Indian language)
  ├─ voice    → Sarvam saaras (STT, mode=translate) → English text
  └─ text     → Sarvam mayura (auto-detect) → English text
  photo       → Gemma vision (multimodal diagnosis, English question built from caption)
        ↓
  Gemma (gemma-4-31b-it) + tools via Gemini API
    tools: setReminder (node-cron + SQLite), sendEmail (human escalation)
        ↓
  Guardrail: pesticide numbers without expert advisory → safety footer appended (deterministic code, not the model)
        ↓
  Sarvam mayura → translate reply to farmer's language
        ↓
  Farmer receives: text (+ WAV→OGG/Opus voice note via Sarvam bulbul, when voice is ON)
```

Deterministic pieces (code decides, not the model):

- **Language routing** — detector + explicit "my name is Ramesh, I farm..." profile saves
- **Safety footer** — `src/guardrails.ts` appends a KVK (Krishi Vigyan Kendra) advisory when a reply contains pesticide numbers without an expert-confirm recommendation
- **Reminders** — cron expressions issued by the model are validated and scheduled by `node-cron`; missed fires replay on boot via `setActiveReminders`
- **Rate limiting / reply delays** — human-like pacing per chat

## Eval

`npm run eval` runs the harness in dry mode (harness sanity, no API calls).
`npm run eval:live` runs the same 10 golden farmer questions against the real model and writes `eval/results-latest.md`.

Checks are programmatic, not vibes: diagnosis mentioned, practical steps given, expert-confirm advisory present, out-of-scope declines, clarifying question asked, WhatsApp-short replies, and "no exact pesticide dosage without confirmation" (the critical one).

## Metrics

SQLite `metrics` table (`src/memory/db.ts`): `messages_handled`, `crop_photos`, `voice_notes_sent` — plus guardrail flags logged with counts (see "Known limits").

## Stack

| Layer | Choice |
|-------|--------|
| WhatsApp | Baileys |
| AI brain | Gemma 4 via Gemini API (`gemma-4-31b-it`) |
| Language | Sarvam AI (mayura translate / saaras STT / bulbul TTS) |
| Memory | SQLite via `node:sqlite` (zero native deps) |
| Reminders | node-cron + SQLite |
| Audio conversion | ffmpeg-static |
| Runtime | Node.js 24+ / TypeScript (ESM) |
| Process | PM2 (`ecosystem.config.cjs`) |

## Run it

```bash
cp .env.example .env        # fill in SARVAM_API_KEY, GEMINI_API_KEY, EMAIL_*, OWNER_JID
npm install
npm run build
node dist/index.js          # scan the WhatsApp QR once; then message the number
pm2 start ecosystem.config.cjs   # for the long-running demo
```

## Known limits (honest)

- Eval is signal-level (keyword/structure checks), not human-graded; live scores with `gemma-4-31b-it` are in `eval/results-latest.md`.
- Guardrail is a regex clamp on English model output before translation, not a pharmacological database.
- Reminder cron strings come from the model; we validate shape but cannot validate farmer intent.
- No web search tool in the loop: scheme answers are bounded to what the model knows, with official-source nudges.

## License

MIT — see [LICENSE](LICENSE).
