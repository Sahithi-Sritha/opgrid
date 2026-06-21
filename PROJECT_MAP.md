# 🗺️ OpGrid Project Map

Quick reference guide to navigate the codebase.

## 📂 File Structure

```
opgrid/
│
├── 📖 DOCUMENTATION
│   ├── START_HERE.md          ← 👈 Read this first!
│   ├── README.md              ← Project overview
│   ├── QUICKSTART.md          ← Setup in 10 min
│   ├── DEPLOYMENT.md          ← Deploy to production
│   ├── ARCHITECTURE.md        ← How it works
│   ├── CONTRIBUTING.md        ← Add new features
│   ├── CHECKLIST.md           ← Verify setup
│   ├── TODO.md                ← Future roadmap
│   └── PROJECT_SUMMARY.md     ← Complete overview
│
├── 🗄️ DATABASE
│   └── schema.sql             ← PostgreSQL schema (run in Supabase)
│
├── 🎨 FRONTEND (Next.js 14)
│   └── frontend/
│       ├── 📄 Configuration
│       │   ├── package.json           ← Dependencies
│       │   ├── tsconfig.json          ← TypeScript config
│       │   ├── tailwind.config.ts     ← Styling
│       │   ├── next.config.js         ← Next.js settings
│       │   ├── .env.example           ← Environment template
│       │   └── .env.local             ← Your credentials (create this)
│       │
│       ├── 🌐 Pages (App Router)
│       │   └── app/
│       │       ├── page.tsx           ← Home (redirects to /feed)
│       │       ├── layout.tsx         ← Root layout + Sidebar
│       │       ├── globals.css        ← Global styles
│       │       ├── feed/
│       │       │   └── page.tsx       ← 🔥 Main feed page
│       │       ├── tracker/
│       │       │   └── page.tsx       ← 📊 Application tracker
│       │       ├── resume/
│       │       │   └── page.tsx       ← 📄 Resume analyzer
│       │       └── settings/
│       │           └── page.tsx       ← ⚙️ Settings
│       │
│       ├── 🧩 Components
│       │   └── components/
│       │       ├── Sidebar.tsx        ← Left navigation
│       │       └── Badge.tsx          ← Tag badges
│       │
│       ├── 🔧 Utilities
│       │   └── lib/
│       │       └── supabase.ts        ← Database client + types
│       │
│       └── 🌐 Public Assets
│           └── public/
│               └── manifest.json      ← PWA manifest
│
└── 🤖 AGENT (Background Worker)
    └── agent/
        ├── 📄 Configuration
        │   ├── package.json           ← Dependencies
        │   ├── tsconfig.json          ← TypeScript config
        │   ├── .env.example           ← Environment template
        │   └── .env                   ← Your API keys (create this)
        │
        └── 💻 Source Code
            └── src/
                ├── index.ts           ← 🚀 Main entry point
                │
                ├── 🕷️ Scrapers (Data Collection)
                │   └── scrapers/
                │       ├── linkedin.ts        ← LinkedIn Jobs
                │       ├── wellfound.ts       ← Wellfound (AngelList)
                │       ├── yc.ts              ← Y Combinator Jobs
                │       ├── telegram.ts        ← Telegram groups
                │       └── career-pages.ts    ← Company career pages
                │
                ├── 🤖 Classifier (AI Tagging)
                │   └── classifier/
                │       └── tagger.ts          ← Claude AI integration
                │
                ├── 📬 Notifier (Alerts)
                │   └── notifier/
                │       ├── email.ts           ← Resend integration
                │       └── telegram.ts        ← Telegram bot
                │
                ├── ⏰ Scheduler (Cron Jobs)
                │   └── scheduler/
                │       ├── jobs.ts            ← Main scraping loop
                │       └── deadlines.ts       ← Deadline checking
                │
                └── ⚙️ Config
                    └── config/
                        └── supabase.ts        ← Database client
```

## 🎯 Key Files by Task

### 🚀 Getting Started
1. `START_HERE.md` - Complete setup guide
2. `QUICKSTART.md` - Fast track setup
3. `CHECKLIST.md` - Verify everything works

### 🔧 Configuration
- `frontend/.env.local` - Frontend credentials (create from .env.example)
- `agent/.env` - Agent API keys (create from .env.example)
- `schema.sql` - Database schema (run in Supabase)

### 🎨 Frontend Development
- `frontend/app/feed/page.tsx` - Opportunity feed (main UI)
- `frontend/app/tracker/page.tsx` - Application tracker
- `frontend/components/Sidebar.tsx` - Navigation
- `frontend/lib/supabase.ts` - Database queries

### 🤖 Agent Development
- `agent/src/index.ts` - Start here for agent logic
- `agent/src/scheduler/jobs.ts` - Scraping orchestration
- `agent/src/scrapers/*.ts` - Add new sources here
- `agent/src/classifier/tagger.ts` - AI tagging logic

### 📚 Understanding the System
- `ARCHITECTURE.md` - System design
- `PROJECT_SUMMARY.md` - Complete overview
- `README.md` - Project introduction

### 🚢 Deployment
- `DEPLOYMENT.md` - Production deployment guide
- `frontend/package.json` - Vercel build commands
- `agent/package.json` - Railway build commands

### 🤝 Contributing
- `CONTRIBUTING.md` - How to add features
- `TODO.md` - Feature wishlist

## 🎨 UI Pages Overview

### `/feed` - Main Feed
**File**: `frontend/app/feed/page.tsx`  
**Purpose**: Display all scraped opportunities  
**Features**:
- Filter by tags (internship, remote, etc.)
- Mark as seen
- View external posting links
- Show deadline warnings

### `/tracker` - Application Tracker
**File**: `frontend/app/tracker/page.tsx`  
**Purpose**: Track application pipeline  
**Features**:
- Status tracking (Applied → Interview → Offer)
- Referral tracking
- Follow-up reminders
- Personal notes

### `/resume` - Resume Analyzer
**File**: `frontend/app/resume/page.tsx`  
**Purpose**: Match resume against job descriptions  
**Features**:
- Paste JD + resume
- AI-powered keyword analysis
- Match score
- Improvement suggestions

### `/settings` - Settings
**File**: `frontend/app/settings/page.tsx`  
**Purpose**: Configure notifications and sources  
**Features**:
- Email notifications toggle
- Telegram notifications toggle
- Daily digest settings
- Scraper source management

## 🤖 Agent Components

### Scrapers (`agent/src/scrapers/`)
**Purpose**: Fetch jobs from different sources  
**How to add**: Copy existing scraper, modify selectors  
**Returns**: Array of `Opportunity` objects

### Classifier (`agent/src/classifier/tagger.ts`)
**Purpose**: AI-powered tagging and data extraction  
**Uses**: Anthropic Claude API  
**Extracts**: Tags, deadlines, stipends, remote status

### Notifier (`agent/src/notifier/`)
**Purpose**: Send alerts via email and Telegram  
**Files**:
- `email.ts` - Resend integration
- `telegram.ts` - Telegram bot

### Scheduler (`agent/src/scheduler/`)
**Purpose**: Cron job orchestration  
**Jobs**:
- Scraping: Every 6 hours
- Daily digest: 9 AM daily
- Deadline check: 8 AM daily

## 📊 Database Tables

### `opportunities`
**Stores**: All scraped job postings  
**Key fields**: title, company, source, url (unique), tags[], deadline

### `applications`
**Stores**: User application records  
**Key fields**: opportunity_id, status, resume_version, notes

### `resume_analyses`
**Stores**: Resume-JD match results  
**Key fields**: jd_text, resume_text, match_score, keywords

### `notif_log`
**Stores**: Notification audit trail  
**Key fields**: type (email/telegram), payload, sent_at

## 🔄 Data Flow

```
User Opens /feed
    ↓
Query Supabase opportunities table
    ↓
Render opportunity cards
    ↓
User clicks opportunity
    ↓
Mark as seen (update seen_at)
```

```
Cron triggers (every 6 hours)
    ↓
Run all scrapers
    ↓
Get raw HTML/data
    ↓
Claude AI classification
    ↓
Check if URL exists (dedup)
    ↓
Insert new opportunities
    ↓
Send notifications
```

## 🛠️ Common Tasks

### Add a New Scraper
1. Create `agent/src/scrapers/your-source.ts`
2. Export `scrapeYourSource()` function
3. Return `Opportunity[]`
4. Add to `agent/src/scheduler/jobs.ts` scrapers array

### Modify Frontend Page
1. Edit `frontend/app/[page-name]/page.tsx`
2. Use Supabase client from `lib/supabase.ts`
3. Follow existing patterns for queries

### Change Cron Schedule
1. Edit `agent/src/index.ts`
2. Modify `cron.schedule()` expressions
3. Format: `'minute hour day month dayOfWeek'`

### Add New Tag Type
1. Update `agent/src/classifier/tagger.ts` prompt
2. Update frontend filter buttons in `app/feed/page.tsx`

## 🔍 Finding Things

### "Where is the main feed query?"
→ `frontend/app/feed/page.tsx` line ~20

### "Where are scrapers registered?"
→ `agent/src/scheduler/jobs.ts` line ~10

### "Where is AI tagging done?"
→ `agent/src/classifier/tagger.ts`

### "Where are cron jobs defined?"
→ `agent/src/index.ts` line ~30

### "Where is the database schema?"
→ `schema.sql` (root directory)

### "Where are notification templates?"
→ `agent/src/notifier/email.ts` (email) and `telegram.ts` (Telegram)

## 📱 Quick Commands

```bash
# Development
cd frontend && npm run dev      # Start frontend
cd agent && npm run dev         # Start agent

# Build
cd frontend && npm run build    # Build frontend
cd agent && npm run build       # Build agent

# Verify
node verify-setup.js            # Check setup

# Database
# Run schema.sql in Supabase SQL Editor
```

## 🆘 Help Resources

- **Setup issues**: `START_HERE.md` or `QUICKSTART.md`
- **Architecture questions**: `ARCHITECTURE.md`
- **Want to contribute**: `CONTRIBUTING.md`
- **Deploy to prod**: `DEPLOYMENT.md`
- **Feature ideas**: `TODO.md`

---

**Lost?** Start with `START_HERE.md` 🚀
