# OpGrid - Project Summary

## What is OpGrid?

OpGrid is a **24/7 automated opportunity aggregator** that scrapes internships and job postings from multiple sources, intelligently tags them with AI, and sends you notifications via email and Telegram when important opportunities appear or deadlines approach.

## Core Features ✨

### 🔍 Multi-Source Scraping
- **LinkedIn Jobs** - Software engineering internships
- **Wellfound** (AngelList) - Startup opportunities  
- **YC Jobs** - Y Combinator company positions
- **Telegram Groups** - Intern community channels
- **Company Career Pages** - Direct from Stripe, Airbnb, Figma, etc.

### 🏷️ Intelligent Auto-Tagging
Uses Anthropic Claude to automatically detect:
- `internship` - Is this an internship?
- `remote` - Can you work remotely?
- `stipend` - Does it mention compensation?
- `OA` - Online assessment required?
- `referral` - Referral bonus available?

### 📧 Smart Notifications
- **Daily Email Digest** - Summary of new opportunities (9 AM)
- **Telegram Alerts** - Instant notifications for high-priority roles
- **Deadline Reminders** - Alert 3 days before applications close
- **PWA Support** - Install as a mobile app

### 📊 Application Tracker
- Track application status (Applied → OA → Interview → Offer)
- Store resume versions used
- Track referrals and follow-ups
- Add personal notes

### 📄 Resume Analyzer (Coming Soon)
- AI-powered resume-JD matching
- Keyword gap analysis
- Match score percentage
- Tailored suggestions

## Tech Stack

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Node.js + Express
Database:  Supabase (PostgreSQL)
AI:        Anthropic Claude
Email:     Resend
Messaging: Telegram Bot API
Scraping:  Axios + Cheerio (+ Puppeteer for JS sites)
Hosting:   Vercel (frontend) + Railway (agent)
```

## Project Structure

```
opgrid/
├── frontend/              # Next.js application
│   ├── app/              
│   │   ├── feed/         # Opportunity feed page
│   │   ├── tracker/      # Application tracker
│   │   ├── resume/       # Resume analyzer
│   │   └── settings/     # User preferences
│   ├── components/       # React components
│   └── lib/             # Supabase client
│
├── agent/                # Background scraping agent
│   └── src/
│       ├── scrapers/     # Source-specific scrapers
│       ├── classifier/   # AI tagging logic
│       ├── notifier/     # Email & Telegram
│       └── scheduler/    # Cron jobs
│
├── schema.sql           # Database schema
├── QUICKSTART.md        # Get running in 10 min
├── DEPLOYMENT.md        # Production deploy guide
└── ARCHITECTURE.md      # System design doc
```

## Database Schema

### `opportunities` table
Stores all scraped job postings with tags, deadlines, and metadata

### `applications` table  
Tracks user applications with status pipeline and notes

### `resume_analyses` table
AI-powered resume-JD match analyses

### `notif_log` table
Audit log of all sent notifications

## How It Works

1. **Scraping**: Agent runs every 6 hours, hitting all sources
2. **Classification**: Claude analyzes each posting, extracts tags/deadlines/stipends
3. **Deduplication**: URL-based to prevent duplicate entries
4. **Storage**: New opportunities saved to Supabase
5. **Notification**: Email digest + Telegram for urgent items
6. **User Action**: Browse feed, mark as seen, create application records

## Setup Time

- **Development**: 10 minutes (see QUICKSTART.md)
- **Production**: 30 minutes (see DEPLOYMENT.md)

## Deployment Options

| Component | Free Option | Paid Option | Cost |
|-----------|-------------|-------------|------|
| Frontend | Vercel Free | Vercel Pro | $0-20/mo |
| Agent | Railway Free ($5 credit) | Railway | $5-10/mo |
| Database | Supabase Free | Supabase Pro | $0-25/mo |
| Email | Resend Free (100/day) | Resend Pro | $0-10/mo |
| AI | Anthropic Pay-as-you-go | - | ~$10/mo |
| **Total** | **~$10/mo** | **~$60/mo** | - |

## Key Benefits

✅ **Saves Time**: No more manual job board checking  
✅ **Never Miss Deadlines**: Automatic deadline tracking  
✅ **Centralized**: All opportunities in one place  
✅ **Organized**: Track applications with notes  
✅ **Smart**: AI-powered tagging and matching  
✅ **Free (mostly)**: Can run on free tiers  
✅ **Open Source**: Customize to your needs

## Limitations & Future Work

### Current Limitations
- LinkedIn scraping requires authentication (use Puppeteer)
- Telegram requires MTProto for reading channels
- No authentication (single-user for now)
- Basic scraping (some sites block it)

### Planned Features (see TODO.md)
- Multi-user auth with Supabase Auth
- Browser extension for "save job" button
- Mobile app (React Native)
- More scrapers (Indeed, Glassdoor, Handshake)
- Cover letter generator
- Interview prep resources per company
- Salary data aggregation

## Quick Commands

```bash
# Development
cd frontend && npm run dev       # Frontend on :3000
cd agent && npm run dev          # Agent on :3001

# Production
cd frontend && npm run build && npm start
cd agent && npm run build && npm start

# Database
psql -f schema.sql              # Apply schema
```

## Documentation Files

- **QUICKSTART.md** - Get running locally in 10 minutes
- **DEPLOYMENT.md** - Deploy to production (Vercel + Railway)
- **ARCHITECTURE.md** - System design and tech decisions
- **CONTRIBUTING.md** - How to add new scrapers
- **TODO.md** - Feature backlog
- **README.md** - Main project documentation

## Use Cases

1. **Students**: Find internships from all sources in one place
2. **New Grads**: Track full-time new grad positions
3. **Career Switchers**: Monitor specific companies
4. **Recruiters**: Competitive intelligence on job postings
5. **Researchers**: Dataset of job market trends

## Success Metrics

- ✅ Aggregates 50-100+ opportunities per day
- ✅ 99% uptime for 24/7 agent
- ✅ <5 min delay for new opportunities
- ✅ <1% duplicate rate
- ✅ 90%+ tagging accuracy

## Contributing

We welcome contributions! See CONTRIBUTING.md for:
- How to add new scrapers
- Code style guide
- Testing requirements
- PR process

## License

MIT License - free to use and modify

## Support

- GitHub Issues for bugs
- Discussions for feature requests
- Pull requests welcome!

---

**Built for the job search grind. Open source. Actually useful.** 🎯
