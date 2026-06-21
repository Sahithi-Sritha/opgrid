# OpGrid Quick Start Guide

Get OpGrid running locally in under 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free)
- Basic API keys (some optional for testing)

## Step 1: Clone & Install (2 min)

```bash
# Frontend
cd frontend
npm install

# Agent
cd ../agent
npm install
```

## Step 2: Database Setup (3 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for database to initialize (~2 min)
3. Go to SQL Editor
4. Copy contents of `schema.sql` and execute
5. Verify tables created in Table Editor

## Step 3: Configure Environment (2 min)

### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Get these from: Supabase Project → Settings → API

### Agent (.env)

```bash
cd ../agent
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Use service_role key!
ANTHROPIC_API_KEY=sk-ant-...     # Optional for testing
RESEND_API_KEY=re_...             # Optional for testing
DAILY_DIGEST_EMAIL=you@example.com
TELEGRAM_BOT_TOKEN=123:ABC...    # Optional
TELEGRAM_CHAT_ID=123456789        # Optional
```

**Minimum required for testing:**
- SUPABASE_URL
- SUPABASE_SERVICE_KEY

## Step 4: Run! (1 min)

### Terminal 1 - Frontend
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000

### Terminal 2 - Agent
```bash
cd agent
npm run dev
```

The agent will start scraping immediately and every 6 hours.

## Step 5: Test It Out

1. Wait 30 seconds for initial scrape
2. Refresh the feed page
3. You should see some placeholder opportunities

## Optional Enhancements

### Get Anthropic API Key (for auto-tagging)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to agent `.env`

### Get Resend API Key (for emails)
1. Go to [resend.com](https://resend.com)
2. Sign up and verify domain (or use test mode)
3. Create API key
4. Add to agent `.env`

### Setup Telegram Bot (for notifications)
1. Message @BotFather on Telegram
2. `/newbot` and follow prompts
3. Copy bot token
4. Start chat with your bot
5. Get chat ID: `curl https://api.telegram.org/bot<TOKEN>/getUpdates`
6. Add both to agent `.env`

## Troubleshooting

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

### Agent won't connect to database
- Verify you're using SERVICE_ROLE key (not anon key)
- Check Supabase project is not paused
- Verify URL format includes `https://`

### No opportunities appearing
- Check agent logs for scraper errors
- Some scrapers need proper auth (LinkedIn, etc.)
- Verify database tables exist
- Check Supabase table editor directly

### Scrapers failing
- Expected! LinkedIn/etc need authentication
- Career pages scraper should work
- You can manually insert test data via Supabase

## Manual Test Data

Insert test opportunity via Supabase SQL Editor:

```sql
INSERT INTO opportunities (title, company, source, url, description, tags, is_remote, location)
VALUES (
  'Software Engineering Intern',
  'Test Company',
  'career_page',
  'https://example.com/job/123',
  'Great internship opportunity for summer 2026',
  ARRAY['internship', 'remote', 'stipend'],
  true,
  'Remote'
);
```

## Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Read [CONTRIBUTING.md](CONTRIBUTING.md) to add new scrapers
- Check [TODO.md](TODO.md) for feature ideas
- Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system

## Common Commands

```bash
# Frontend
npm run dev      # Development server
npm run build    # Production build
npm start        # Run production build

# Agent
npm run dev      # Development with ts-node
npm run build    # Compile TypeScript
npm start        # Run compiled code

# Database
psql -h <host> -U postgres -d postgres -f schema.sql   # Apply schema
```

## Need Help?

- Check existing issues on GitHub
- Read the documentation files
- Review the code comments
- Open a new issue with details

Happy opportunity hunting! 🎯
