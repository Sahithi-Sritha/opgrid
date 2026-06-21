# 🎯 START HERE - OpGrid Setup Guide

Welcome to OpGrid! This guide will get you from zero to running in the fastest way possible.

## 📋 What You Just Built

OpGrid is a **24/7 opportunity aggregator** that:
- 🔍 Scrapes jobs from LinkedIn, Wellfound, YC, Telegram, career pages
- 🏷️ Auto-tags with AI (internship, remote, stipend, OA, referral)
- 📧 Sends daily email digests
- 💬 Sends Telegram notifications
- 📊 Tracks your applications
- 📄 Analyzes resume-JD matches

## 🚀 Quick Start (Choose Your Path)

### Path 1: Just Want to See It Work? (5 min)

```bash
# 1. Install dependencies
cd frontend
npm install
cd ../agent
npm install

# 2. Setup Supabase
# → Go to https://supabase.com
# → Create project
# → Copy schema.sql into SQL Editor and run

# 3. Configure
cd ../frontend
copy .env.example .env.local
# Edit .env.local with Supabase URL + ANON_KEY

cd ../agent
copy .env.example .env
# Edit .env with Supabase URL + SERVICE_KEY

# 4. Run
# Terminal 1:
cd frontend
npm run dev

# Terminal 2:
cd agent
npm run dev

# 5. Visit http://localhost:3000
```

### Path 2: Full Production Setup (30 min)

Follow **QUICKSTART.md** for detailed instructions.

## 📁 What Files Do What?

### Documentation (Read These!)
```
README.md          → Project overview and features
QUICKSTART.md      → Detailed setup guide (10 min)
DEPLOYMENT.md      → Deploy to production (Vercel + Railway)
ARCHITECTURE.md    → How everything works
CHECKLIST.md       → Verify your setup is correct
TODO.md            → Future features and roadmap
```

### Database
```
schema.sql         → PostgreSQL schema (run in Supabase)
```

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── feed/          → Opportunity feed page
│   ├── tracker/       → Application tracker
│   ├── resume/        → Resume analyzer
│   └── settings/      → User settings
├── components/        → Reusable UI components
└── lib/supabase.ts    → Database client
```

### Agent (Background Worker)
```
agent/src/
├── scrapers/          → Source-specific scrapers
│   ├── linkedin.ts
│   ├── wellfound.ts
│   ├── yc.ts
│   ├── telegram.ts
│   └── career-pages.ts
├── classifier/        → AI tagging (Claude)
├── notifier/          → Email + Telegram
└── scheduler/         → Cron jobs
```

## 🔑 Required API Keys

| Service | Required? | Get It From | Used For |
|---------|-----------|-------------|----------|
| Supabase | ✅ Yes | https://supabase.com | Database |
| Anthropic | ⚠️ Optional | https://console.anthropic.com | AI tagging |
| Resend | ⚠️ Optional | https://resend.com | Email digests |
| Telegram | ⚠️ Optional | @BotFather on Telegram | Push notifications |

**Minimum to run**: Just Supabase (free tier)

## 🎬 First Time Setup

### Step 1: Database (5 min)

1. Go to https://supabase.com
2. Create new project (wait 2 min for setup)
3. Go to SQL Editor
4. Copy entire contents of `schema.sql`
5. Paste and click "Run"
6. Go to Table Editor → verify 4 tables exist

### Step 2: Get Credentials (2 min)

In Supabase:
- Go to Settings → API
- Copy "Project URL" → this is `SUPABASE_URL`
- Copy "anon public" key → this is `ANON_KEY`
- Copy "service_role" key → this is `SERVICE_KEY` (keep secret!)

### Step 3: Configure Frontend (1 min)

```bash
cd frontend
copy .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 4: Configure Agent (1 min)

```bash
cd agent
copy .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...   # Use service_role, not anon!

# Optional (for testing)
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
DAILY_DIGEST_EMAIL=you@example.com
TELEGRAM_BOT_TOKEN=123:ABC...
TELEGRAM_CHAT_ID=123456
```

### Step 5: Install & Run (2 min)

```bash
# Frontend
cd frontend
npm install
npm run dev    # Runs on :3000

# Agent (new terminal)
cd agent
npm install
npm run dev    # Runs on :3001
```

### Step 6: Verify (1 min)

1. Open http://localhost:3000
2. You should see the OpGrid interface
3. Check agent logs - should see "🔍 Starting all scrapers..."
4. Wait 30 seconds
5. Refresh feed page - opportunities should appear
6. ✅ Done!

## 🐛 Troubleshooting

### "Can't connect to database"
- Verify you used SERVICE_KEY in agent (not anon key)
- Check Supabase project is not paused
- Ensure URL includes `https://`

### "No opportunities appearing"
- Expected! Some scrapers need auth (LinkedIn)
- Insert test data via Supabase SQL Editor:
  ```sql
  INSERT INTO opportunities (title, company, source, url, tags, is_remote)
  VALUES ('Test Intern', 'Test Co', 'career_page', 'https://test.com/1', 
          ARRAY['internship','remote'], true);
  ```

### "Frontend won't start"
- Check Node version: `node --version` (need 18+)
- Delete `frontend/.next` and retry
- Run `npm install` again

### "Agent crashes"
- Check all environment variables are set
- Verify Supabase credentials
- Check logs for specific error

## 📚 Next Steps

Once running locally:

1. **Add more scrapers** → See `CONTRIBUTING.md`
2. **Deploy to production** → See `DEPLOYMENT.md`
3. **Get API keys** → Enable notifications
4. **Customize** → Edit scrapers for your needs

## 🎯 Usage

### Daily Workflow

1. **Morning**: Check email digest (9 AM daily)
2. **Browse**: Open OpGrid feed
3. **Filter**: Click tags (remote, internship, etc.)
4. **Apply**: Click "View posting" → apply
5. **Track**: Go to Tracker → add application record
6. **Repeat**: Agent scrapes every 6 hours automatically

### Application Tracking

1. See opportunity you like
2. Apply on company website
3. Go to Tracker page
4. Add application record with:
   - Status (Applied)
   - Resume version used
   - Notes
5. Update status as you progress:
   - Applied → OA Received → OA Done → Interview → Offer

## 💡 Pro Tips

- **Filters**: Use tags to narrow down opportunities
- **Deadlines**: Agent alerts you 3 days before
- **Resume**: Test your resume against JDs (Resume page)
- **Sources**: Add more companies to `career-pages.ts`
- **Telegram**: Get instant notifications on your phone

## 🤝 Need Help?

- **Quick questions**: Check `QUICKSTART.md`
- **Troubleshooting**: See `CHECKLIST.md`
- **Contributing**: Read `CONTRIBUTING.md`
- **Architecture**: Understand the system in `ARCHITECTURE.md`

## ✅ Verification Checklist

Run this to verify everything is set up:

```bash
node verify-setup.js
```

Should see all green checkmarks!

## 🎉 You're Ready!

If you've made it here and everything works, congratulations! 

You now have:
- ✅ A working opportunity aggregator
- ✅ 24/7 automated scraping
- ✅ AI-powered tagging
- ✅ Application tracking
- ✅ Smart notifications

**Happy job hunting!** 🎯

---

**Need to deploy?** → Read `DEPLOYMENT.md`  
**Want to contribute?** → Read `CONTRIBUTING.md`  
**Curious how it works?** → Read `ARCHITECTURE.md`

<div align="center">

**Built for the grind. Open source. Actually useful.**

[Report Bug](https://github.com/yourusername/opgrid/issues) • [Request Feature](https://github.com/yourusername/opgrid/issues) • [Contribute](CONTRIBUTING.md)

</div>
