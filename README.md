# DownToTalk

> When AI sleeps, humans connect.

**The app that only works when AI doesn't.** DownToTalk monitors AI service outages (Claude, ChatGPT, Gemini) and matches users for spontaneous calls when services go down.

Every AI outage is an opportunity for human connection.

## Philosophy

We spend 8 hours a day talking to machines. When the machines stop talking back, we stare at error messages and refresh status pages. DownToTalk turns downtime into connection time.

## How It Works

1. **AI goes down** — We monitor status pages of Claude, ChatGPT, Gemini, and more
2. **You get notified** — Push notification: "Claude is down. 47 people are free right now."
3. **Talk to a human** — See who's available, pick someone, choose your platform (Zoom, Meet, Telegram, WhatsApp)

No scheduling. No planning. Just connect.

## Key Decisions

### Naming: DownToTalk

Double meaning: "AI is **down**" + "I'm **down to talk**". Memorable, shareable, viral-friendly.

Alternatives considered: HumanWhenDown, WhenDown, Offline.social, HumanFallback.

### Auth: Google OAuth (primary) + GitHub OAuth

**Google** is the primary auth provider because:
- Most users already have Google accounts
- Enables Google Meet integration for call links
- Lower friction than GitHub for non-developer users

**GitHub** as secondary auth for the developer audience (AI/ML community).

### No custom video calling

We don't build video infrastructure. Instead, we generate links for platforms people already use:
- **Telegram** / **WhatsApp** — deeplinks (zero integration, MVP)
- **Google Meet** — via Google Calendar API (post-OAuth)
- **Zoom** — via personal meeting links or Zoom API

### Status monitoring

AI service status is polled via RSS feeds:
- Claude: `status.claude.com/history.rss`
- OpenAI: `status.openai.com/history.rss`
- Google: `status.cloud.google.com`

Polling interval: 60 seconds. Fallback: direct HTTP health checks.

### Dark theme only

The landing page and app use a dark theme exclusively. It matches the developer audience aesthetic and the "status page" visual language.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 + Tailwind CSS | SSR for landing (SEO), React for app |
| Backend | Next.js API Routes | Single deploy, no separate backend |
| Database | Supabase (PostgreSQL + Auth + Realtime) | Auth out of the box, realtime for presence |
| Monitoring | Cron jobs polling RSS feeds | Simple, reliable, no vendor lock-in |
| Push | Web Push API | Native browser notifications |
| Hosting | Vercel | Free tier, edge network |
| Analytics | PostHog | Privacy-friendly, open source |

## Roadmap

### Phase 1: Claude Is Down (MVP)
- [x] Landing page with manifesto
- [ ] Supabase setup (auth, database)
- [ ] Claude status RSS monitoring
- [ ] Google OAuth + GitHub OAuth
- [ ] User profiles (name, avatar, timezone, platforms)
- [ ] Push notifications on downtime
- [ ] Availability toggle ("I'm free")
- [ ] People list (who's available)
- [ ] Call initiation (Telegram/WhatsApp deeplinks)

### Phase 2: Multi-AI
- [ ] OpenAI status monitoring
- [ ] Gemini status monitoring
- [ ] Service selector (choose which AI you use)
- [ ] Public downtime dashboard

### Phase 3: Serious Product
- [ ] Interest tags for smarter matching
- [ ] Timezone-aware matching
- [ ] Google Meet / Zoom integration (OAuth)
- [ ] Connection history
- [ ] Telegram bot for notifications
- [ ] Mobile PWA

## Data

| Metric | Value | Source |
|--------|-------|--------|
| Claude Code uptime (90d) | 99.64% | status.claude.com |
| Claude.ai uptime (90d) | 99.38% | status.claude.com |
| Avg incident duration | ~256 min | IsDown |
| Incidents since Oct 2025 | 144 | IsDown |
| Direct competitors (social + downtime) | **None** | Market research |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

MIT
