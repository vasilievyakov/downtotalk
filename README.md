<div align="center">

<br>

# Down**To**Talk

### When your AI goes down, your friends go up.

<br>

[**Try it live →**](https://downtotalk.vercel.app) · [Source](https://github.com/vasilievyakov/downtotalk)

<br>

</div>

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────────────┐
│ Claude says  │       │  One tap:    │       │  Your circle gets a      │
│ "rate limit  │ ────→ │  "I hit my   │ ────→ │  Telegram notification:  │
│  exceeded"   │       │   limit"     │       │                          │
└──────────────┘       └──────────────┘       │  [Message on Telegram]   │
                                              │  [Call on WhatsApp]      │
                                              │  [Join Zoom]             │
                                              └──────────────────────────┘
```

<br>

## The problem

```
Without DownToTalk:                  With DownToTalk:

Claude is down.                      Claude is down.
You stare at the screen.             Your friends get notified.
You refresh every 30 seconds.        Someone messages you.
You feel stuck and alone.            You have a real conversation.
```

<br>

## How it works

🔴 **You hit your limit** — tap Claude, ChatGPT, or Gemini on the dashboard. One tap.

📱 **Your circle gets a Telegram message** — with inline buttons to reach you directly. No app to install.

🗣️ **You talk** — on Telegram, WhatsApp, or Zoom. From the notification. One more tap.

We also monitor AI status pages every 5 minutes. When a service goes down for everyone — your circle gets notified automatically. No button needed.

<br>

## What it looks like

<p align="center">
  <img src="docs/telegram-notification.png" width="380" alt="Telegram notification with inline buttons" />
</p>

<p align="center"><em>Your friend hits their Claude limit. You get this. One tap — you're talking.</em></p>

<p align="center">
  <img src="docs/hero.png" width="700" alt="DownToTalk dashboard with live AI status" />
</p>

<p align="center"><em>Live AI status dashboard. Real-time. No login required.</em></p>

<br>

## Why I built this

Claude went down during a deadline. I sat there refreshing the status page. Then I realized — my friend was probably doing the same thing right now, three time zones away. We could have just... talked.

Rate limits hit thousands of people daily. Claude uptime is 99.64% — but that 0.36% is millions of wasted minutes. Every one of them is a chance to connect with a real person.

<br>

## Public API

```
GET https://downtotalk.vercel.app/api/status
```

Returns real-time AI service status + how many people are free right now. No API key. Build on it.

<details>
<summary>Example response</summary>

```json
{
  "statuses": [
    {"service": "claude", "status": "operational", "statusText": "Operational"},
    {"service": "openai", "status": "operational", "statusText": "Operational"},
    {"service": "gemini", "status": "operational", "statusText": "Operational"}
  ],
  "availableCount": 2,
  "timestamp": "2026-03-18T20:00:00.000Z"
}
```

</details>

<br>

## Get started

Visit **[downtotalk.vercel.app](https://downtotalk.vercel.app)**, sign in with GitHub. Done.

Want to run it locally?

```bash
git clone https://github.com/vasilievyakov/downtotalk.git && cd downtotalk
npm install && cp .env.example .env.local && npm run dev
```

<br>

## Architecture

```
User hits limit ──→ Next.js API ──→ Neon Postgres
                         │
                         ├──→ Telegram Bot (inline keyboard)
                         │         │
                         │         └──→ Circle members get notified
                         │
UptimeRobot (5 min) ──→ /api/status ──→ RSS/JSON (Claude, ChatGPT, Gemini)
                              │
                              └──→ Status changed? ──→ Notify subscribers
```

<details>
<summary>Full stack</summary>

Next.js 16 · React 19 · Tailwind CSS 4 · Drizzle ORM · Neon Postgres · NextAuth 5 · Telegram Bot API · UptimeRobot · Vercel

</details>

<br>

---

<div align="center">

<br>

> *We spend 8 hours a day talking to machines.*
> *When the machines stop talking back, we stare at error messages.*
>
> *What if we talked to each other instead?*

<br>

**[downtotalk.vercel.app](https://downtotalk.vercel.app)**

*Built in a weekend. Because sometimes the best thing AI can do is shut up.*

</div>
