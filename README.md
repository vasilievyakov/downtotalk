# DownToTalk

> When AI sleeps, humans connect.

**The app that only works when AI doesn't.** When you hit your Claude, ChatGPT, or Gemini rate limit — you become available to talk to real humans. No scheduling. No planning. Just connect.

## How It Works

1. **You hit your limit** — One tap on Claude / ChatGPT / Gemini button
2. **Your circle gets notified** — Telegram message with inline contact buttons
3. **Talk to a human** — Message on Telegram, call on WhatsApp, or join Zoom. Directly from the notification.

## Live Demo

[downtotalk.vercel.app](https://downtotalk.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS 4 |
| Database | Neon (serverless PostgreSQL) |
| ORM | Drizzle |
| Auth | NextAuth 5 (GitHub OAuth) |
| Notifications | Telegram Bot API (inline keyboards) |
| Status monitoring | RSS parsing (Claude, OpenAI) + Google Cloud JSON (Gemini) |
| Uptime polling | UptimeRobot (5 min interval) |
| Hosting | Vercel |

## Features

- **Live AI Status** — Real-time monitoring of Claude, ChatGPT, Gemini via RSS/JSON
- **One-tap rate limit report** — Per-service buttons, auto-sets you as available
- **Telegram notifications** — Inline keyboard with contact buttons (Telegram, WhatsApp, Zoom, dashboard)
- **Outage detection** — Compares status with DB, notifies subscribers on state transitions
- **Circles** — Invite-based friend groups, auto-created on signup
- **Availability TTL** — Auto-resets after 2 hours
- **Profile setup** — Choose which AI services you use, add contact methods

## Development

```bash
npm install
cp .env.example .env.local  # Add your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (for migrations) |
| `AUTH_SECRET` | NextAuth secret |
| `AUTH_GITHUB_ID` | GitHub OAuth app ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app secret |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (@Downtotalk_bot) |
| `TELEGRAM_WEBHOOK_SECRET` | Secret for webhook verification |

## License

MIT
