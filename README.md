# Harit — WhatsApp Farmer Helpline

Farmers send text, voice notes, or crop photos in any Indian language. Harit replies in the farmer's own language — as text and a voice note.

## AI model

Harit uses **Gemma** through the **Gemini API** for query answering and crop-photo diagnosis (text + image).

- Exact model: `gemma-4-31b-it` (set via `GEMINI_MODEL` in `.env`)
- Language work (detection, translation, speech) is handled by Sarvam AI APIs

## Pipeline

```
Farmer (text / voice / photo, any Indian language)
  → Sarvam: detect + translate to English
  → Gemma (gemma-4-31b-it) via Gemini API: answer
  → Sarvam: translate reply back to the farmer's language
  → Farmer receives: text + voice note
```

## Stack

| Layer | Choice |
|-------|--------|
| WhatsApp | Baileys |
| AI brain | Gemma via Gemini API (`gemma-4-31b-it`) |
| Language | Sarvam (translate / STT / TTS) |
| Memory | SQLite (better-sqlite3) |
| Reminders | node-cron + SQLite |
| Audio conversion | ffmpeg-static |
| Runtime | Node.js 20+ / TypeScript (ESM) |
| Process | PM2 |

## Status

Built during Hacktoberfest Hack Day Bengaluru x AWS Student Builder Group at Atria Institute of Technology (Oct 23, 2026).

## License

MIT — see [LICENSE](LICENSE).
