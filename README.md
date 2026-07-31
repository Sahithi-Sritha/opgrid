# 🎯 OpGrid - Opportunity Aggregator

> **Never miss an internship opportunity again.** OpGrid automatically scrapes jobs from multiple sources, intelligently tags them, and sends you notifications — running 24/7 for free.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

## ✨ Features

### 🔍 **Multi-Source Scraping**
Automatically monitors:
- LinkedIn Jobs
- Wellfound (AngelList Talent)
- Y Combinator Jobs
- Telegram intern groups
- Company career pages (Stripe, Airbnb, Figma, etc.)

### 🏷️ **AI-Powered Auto-Tagging**
Amazon Bedrock (Claude 3 Haiku) automatically detects:
- `internship` - Is this an internship position?
- `remote` - Remote work available?
- `stipend` - Compensation mentioned?
- `OA` - Online assessment required?
- `referral` - Referral bonus offered?

### 📧 **Smart Notifications**
- **Daily Email Digest** - New opportunities at 9 AM
- **Telegram Alerts** - Instant notifications
- **Deadline Reminders** - Alert 3 days before closing
- **PWA Support** - Install as mobile app

### 📊 **Application Tracker**
- Full pipeline tracking (Applied → OA → Interview → Offer)
- Resume version management
- Referral tracking
- Follow-up reminders
- Personal notes

### 📄 **Resume Analyzer** *(Coming Soon)*
- AI-powered resume-JD matching
- Keyword gap analysis
- Match score calculation
- Personalized improvement suggestions

---

## 🚀 Quick Start

Get OpGrid running locally in **under 10 minutes**:

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../agent && npm install

# 2. Setup Supabase (create project at supabase.com)
# Copy schema.sql into Supabase SQL Editor and run

# 3. Configure environment
cp frontend/.env.example frontend/.env.local
cp agent/.env.example agent/.env
# Edit both files with your credentials

# 4. Run!
cd frontend && npm run dev  # Terminal 1 - Frontend on :3000
cd agent && npm run dev     # Terminal 2 - Agent on :3001
```

📖 **Detailed Guide**: See [QUICKSTART.md](QUICKSTART.md)

---

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │  Next.js frontend (Vercel)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │  PostgreSQL database + auth
└──────▲──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Agent (Railway/Render)       │
│  ┌──────────┐  ┌──────────────┐    │
│  │ Scrapers │→ │  Classifier  │────┼──→ Amazon Bedrock
│  └──────────┘  │  (AI-powered)│    │    (Claude 3 Haiku)
│                 └──────┬───────┘    │
│  ┌──────────┐         │             │
│  │Scheduler │  ┌──────▼───────┐    │
│  │(Cron)    │  │  Notifier    │    │
│  └──────────┘  │ Email+Telegram│    │
│                 └──────────────┘    │
└─────────────────────────────────────┘
```

**Data Flow**:
1. Cron triggers scrapers every 6 hours
2. **Amazon Bedrock (Claude AI)** tags and extracts metadata
3. New opportunities saved to Supabase
4. Notifications sent via email/Telegram
5. Users browse feed and track applications

📐 **Detailed Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14 + TypeScript + Tailwind | Server components, great DX |
| **Backend** | Express + node-cron | Lightweight, reliable scheduling |
| **Database** | Supabase (PostgreSQL) | Managed, real-time, built-in auth |
| **AI** | Amazon Bedrock (Claude 3 Haiku) | AWS Free Tier, best text understanding |
| **Email** | Resend | Developer-friendly API |
| **Notifications** | Telegram Bot | Instant push, no app needed |
| **Scraping** | Axios + Cheerio + Puppeteer | HTML parsing + JS rendering |

---

## 📁 Project Structure

```
opgrid/
├── frontend/                # Next.js application
│   ├── app/
│   │   ├── feed/           # Opportunity feed page
│   │   ├── tracker/        # Application tracker
│   │   ├── resume/         # Resume analyzer
│   │   └── settings/       # User preferences
│   ├── components/         # Reusable UI components
│   └── lib/supabase.ts     # Database client
│
├── agent/                  # Background scraping worker
│   └── src/
│       ├── scrapers/       # Source-specific scrapers
│       │   ├── linkedin.ts
│       │   ├── wellfound.ts
│       │   ├── yc.ts
│       │   ├── telegram.ts
│       │   └── career-pages.ts
│       ├── classifier/     # AI tagging
│       │   └── tagger.ts
│       ├── notifier/       # Notification handlers
│       │   ├── email.ts
│       │   └── telegram.ts
│       ├── scheduler/      # Cron jobs
│       │   ├── jobs.ts
│       │   └── deadlines.ts
│       └── index.ts        # Main entry point
│
├── schema.sql              # Supabase database schema
├── QUICKSTART.md           # 10-minute setup guide
├── DEPLOYMENT.md           # Production deployment
├── ARCHITECTURE.md         # System design
└── TODO.md                 # Feature roadmap
```

---

## 📊 Database Schema

### `opportunities`
Core table storing all scraped opportunities
```sql
- id, title, company, source, url (unique)
- description, tags[], deadline, stipend
- location, is_remote, raw_html
- created_at, seen_at
```

### `applications`
User application tracking
```sql
- id, opportunity_id (FK)
- applied_date, status, resume_version
- referral_name, follow_up_sent, notes
```

### `resume_analyses`
AI-powered resume matching
```sql
- id, jd_text, resume_text
- missing_keywords[], present_keywords[]
- match_score, suggestions
```

### `notif_log`
Notification audit trail
```sql
- id, type (email|telegram|push)
- payload (jsonb), sent_at
```

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Agent (Railway)
```bash
cd agent
railway up
```

### Database (Supabase)
Already hosted! Just run `schema.sql` in SQL Editor.

📦 **Full Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid | Monthly Cost |
|---------|-----------|------|--------------|
| Vercel | ✅ Yes | Pro | $0-20 |
| Railway | $5 credit | Pro | $5-10 |
| Supabase | ✅ Yes | Pro | $0-25 |
| Resend | 100 emails/day | Pro | $0-10 |
| Amazon Bedrock | $200 credits (2mo) | Pay-per-use | $0-10 |
| **Total** | **~$10/mo** | **Full** | **$50-60/mo** |

Most students can run this **under $15/month** on free/starter tiers.

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Add a new scraper**: See [CONTRIBUTING.md](CONTRIBUTING.md)
2. **Report bugs**: Open an issue with details
3. **Suggest features**: Check [TODO.md](TODO.md) first
4. **Submit PRs**: Fork, create branch, submit PR

---

## 📚 Documentation

- 🚀 [QUICKSTART.md](QUICKSTART.md) - Get running in 10 minutes
- 📦 [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - System design & tech decisions
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- 📋 [TODO.md](TODO.md) - Feature roadmap
- 📊 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Complete overview

---

## 🎓 Use Cases

- **Students**: Aggregate internships from all sources
- **New Grads**: Track full-time new grad positions
- **Career Switchers**: Monitor specific companies
- **Recruiters**: Competitive intelligence
- **Researchers**: Job market trend data

---

## 🔮 Roadmap

- [x] Multi-source scraping
- [x] AI-powered tagging
- [x] Email + Telegram notifications
- [x] Application tracker
- [ ] User authentication
- [ ] Resume analyzer (AI-powered)
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] More scrapers (Indeed, Glassdoor, Handshake)
- [ ] Cover letter generator
- [ ] Interview prep resources

See full list in [TODO.md](TODO.md)

---

## 📜 License

MIT License - free to use, modify, and distribute.

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Database & auth
- [Amazon Bedrock](https://aws.amazon.com/bedrock/) - AI classification (Claude 3 Haiku)
- [Resend](https://resend.com/) - Email API
- [Cheerio](https://cheerio.js.org/) - HTML parsing

---

## 🚨 Disclaimer

This tool is for **personal use** only. Always:
- Respect website Terms of Service
- Follow robots.txt
- Use rate limiting
- Avoid commercial scraping without permission

---

<div align="center">

**Built for the job search grind. Open source. Actually useful.** 🎯

[Get Started](QUICKSTART.md) • [Deploy](DEPLOYMENT.md) • [Contribute](CONTRIBUTING.md)

</div>
