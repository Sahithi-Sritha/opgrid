# OpGrid Agent

24/7 background scraping agent that monitors multiple sources for internship opportunities.

## Features

- 🕷️ Multi-source web scraping
- 🤖 AI-powered tagging with Claude
- 📧 Daily email digests
- 💬 Telegram notifications
- ⏰ Deadline monitoring
- 🔄 Automatic retry logic

## Setup

```bash
npm install
cp .env.example .env
# Fill in your API keys
npm run dev
```

## Architecture

- **Scrapers**: Source-specific scrapers for each platform
- **Classifier**: AI tagging and data extraction
- **Notifier**: Email and Telegram notification handlers
- **Scheduler**: Cron jobs for automated scraping

## Deployment

Deploy to Railway, Render, or any Node.js hosting:

```bash
npm run build
npm start
```

The agent runs continuously with scheduled cron jobs:
- Scraping: Every 6 hours
- Daily digest: 9 AM daily
- Deadline checks: 8 AM daily

## Adding New Sources

1. Create a new scraper in `src/scrapers/`
2. Export a function returning `Opportunity[]`
3. Add to `src/scheduler/jobs.ts`

## Environment Variables

See `.env.example` for required configuration.
