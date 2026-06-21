# OpGrid Architecture

## Overview

OpGrid is a full-stack opportunity aggregator with a Next.js frontend and a Node.js scraping agent that runs 24/7.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER DEVICES                         │
│                  (Browser, PWA, Mobile)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                          │
│                     (Vercel)                                 │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │   Feed   │ Tracker  │  Resume  │ Settings │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Supabase Client
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Database)                       │
│  ┌───────────────┬──────────────┬─────────────┐            │
│  │ opportunities │ applications │ resume_     │            │
│  │               │              │ analyses    │            │
│  └───────────────┴──────────────┴─────────────┘            │
│  ┌──────────┐                                               │
│  │ Auth     │                                               │
│  └──────────┘                                               │
└─────────────────▲───────────────────────────────────────────┘
                  │
                  │ Supabase Client (Service Key)
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                    AGENT (Background Worker)                 │
│                     (Railway/Render)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    SCHEDULER                         │   │
│  │  - Scrape every 6 hours                             │   │
│  │  - Daily digest at 9 AM                             │   │
│  │  - Deadline check at 8 AM                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    SCRAPERS                          │   │
│  │  ┌──────────┬───────────┬────────┬─────────────┐   │   │
│  │  │ LinkedIn │ Wellfound │ YC Jobs│ Telegram    │   │   │
│  │  └──────────┴───────────┴────────┴─────────────┘   │   │
│  │  ┌─────────────────┐                               │   │
│  │  │ Career Pages    │                               │   │
│  │  └─────────────────┘                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    CLASSIFIER                        │   │
│  │              (Anthropic Claude API)                  │   │
│  │  - Auto-tag: internship, remote, OA, stipend       │   │
│  │  - Extract deadlines, stipends                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    NOTIFIER                          │   │
│  │  ┌──────────────────┬───────────────────────┐      │   │
│  │  │  Email (Resend)  │  Telegram Bot         │      │   │
│  │  └──────────────────┴───────────────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Scraping Flow
```
Cron Trigger → Run All Scrapers → Parse HTML → Extract Data
                                                      ↓
                                        Anthropic Claude Classification
                                                      ↓
                                        Check if URL exists in DB
                                                      ↓
                                        Insert new opportunity
                                                      ↓
                                        Send notifications
```

### User Interaction Flow
```
User opens /feed → Query opportunities from Supabase
                              ↓
                    Render opportunity cards
                              ↓
                    User clicks → Mark as seen
                              ↓
                    User applies → Create application record
```

## Key Technologies

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js 14 | Server components, great DX, Vercel deployment |
| Database | Supabase (PostgreSQL) | Managed Postgres, built-in auth, real-time |
| Agent | Express + node-cron | Lightweight, reliable cron scheduling |
| AI | Anthropic Claude | Best text understanding, structured extraction |
| Email | Resend | Developer-friendly, reliable delivery |
| Notifications | Telegram Bot API | Instant push, no mobile app needed |
| Scraping | axios + cheerio | Simple HTML parsing (Puppeteer for JS-heavy sites) |

## Database Schema

### opportunities
Core table storing all scraped jobs
- Unique constraint on `url` prevents duplicates
- `tags` array for flexible filtering
- `raw_html` stored for re-parsing if needed
- `seen_at` tracks user engagement

### applications
User's application tracking
- Links to opportunity via `opportunity_id`
- Status pipeline tracking
- Notes and follow-up reminders

### resume_analyses  
AI-powered resume matching
- Standalone (not tied to specific opp)
- Reusable analyses
- Stores keywords and suggestions

### notif_log
Audit trail for all notifications
- JSONB payload for flexibility
- Useful for debugging

## Scaling Strategy

### Current (MVP - <1000 opps/day)
- Direct HTTP scraping
- Sequential processing
- Single agent worker
- No caching

### Medium (1k-10k opps/day)
- Add Redis for deduplication
- Job queue (BullMQ)
- Multiple workers
- Rate limiting per source

### Large (10k+ opps/day)
- Distributed scraping
- Proxy rotation
- Kubernetes deployment
- CDN for static assets
- Read replicas for database

## Security

- **API Keys**: All stored in environment variables
- **Supabase Access**: Frontend uses anon key (Row Level Security), agent uses service key
- **HTTPS**: All traffic encrypted
- **No PII**: Only stores job data, not user personal info
- **Rate Limiting**: Respect source sites' robots.txt

## Monitoring

- **Health Check**: `/health` endpoint on agent
- **Logs**: Structured console logging (add Sentry for production)
- **Database**: Supabase dashboard for query performance
- **Scraper Success**: Track insert count per run
- **Notification Delivery**: `notif_log` table

## Cost Breakdown (Monthly)

- Supabase: Free tier → $25 (Pro)
- Vercel: Free tier
- Railway/Render: $5-10 (worker)
- Anthropic API: ~$10 (tagging)
- Resend: Free → $10 (100-1000 emails)
- **Total**: $0-15 (MVP) → $50-60 (scaled)

## Future Enhancements

1. **Authentication**: Add Supabase Auth with email login
2. **Real-time**: Use Supabase subscriptions for live feed updates
3. **Search**: Add full-text search with PostgreSQL
4. **Analytics**: Track application success rates
5. **Mobile**: React Native app or PWA enhancements
6. **Browser Extension**: Save jobs from any site
7. **API**: Public API for integrations
