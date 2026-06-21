# OpGrid Setup Checklist

Use this checklist to ensure you have everything configured correctly.

## ✅ Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Git installed (optional)
- [ ] Code editor (VS Code recommended)

## 🗄️ Database Setup

- [ ] Created Supabase account at https://supabase.com
- [ ] Created new Supabase project
- [ ] Ran `schema.sql` in Supabase SQL Editor
- [ ] Verified tables exist in Table Editor:
  - [ ] `opportunities`
  - [ ] `applications`
  - [ ] `resume_analyses`
  - [ ] `notif_log`
- [ ] Copied `SUPABASE_URL` from Project Settings → API
- [ ] Copied `SUPABASE_ANON_KEY` from Project Settings → API
- [ ] Copied `SUPABASE_SERVICE_KEY` from Project Settings → API (keep secret!)

## 🎨 Frontend Setup

- [ ] `cd frontend`
- [ ] `npm install` completed successfully
- [ ] Copied `.env.example` to `.env.local`
- [ ] Updated `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- [ ] Updated `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- [ ] `npm run dev` starts without errors
- [ ] Visited http://localhost:3000
- [ ] Sidebar navigation works
- [ ] All pages load (Feed, Tracker, Resume, Settings)

## 🤖 Agent Setup

- [ ] `cd agent`
- [ ] `npm install` completed successfully
- [ ] Copied `.env.example` to `.env`
- [ ] Updated `SUPABASE_URL` in `.env`
- [ ] Updated `SUPABASE_SERVICE_KEY` in `.env` (not anon key!)
- [ ] `npm run dev` starts without errors
- [ ] Agent logs show scraping started
- [ ] Health check works: http://localhost:3001/health

## 🔑 API Keys (Optional for MVP)

### Anthropic Claude (for AI tagging)
- [ ] Created account at https://console.anthropic.com
- [ ] Created API key
- [ ] Added `ANTHROPIC_API_KEY` to `agent/.env`
- [ ] Tested: Agent logs show classification working

### Resend (for email notifications)
- [ ] Created account at https://resend.com
- [ ] Verified domain OR using test mode
- [ ] Created API key
- [ ] Added `RESEND_API_KEY` to `agent/.env`
- [ ] Added `DAILY_DIGEST_EMAIL` to `agent/.env`
- [ ] Tested: Manually triggered digest via API

### Telegram Bot (for push notifications)
- [ ] Messaged @BotFather on Telegram
- [ ] Created new bot with `/newbot`
- [ ] Copied bot token
- [ ] Started chat with bot
- [ ] Got chat ID via: `curl https://api.telegram.org/bot<TOKEN>/getUpdates`
- [ ] Added `TELEGRAM_BOT_TOKEN` to `agent/.env`
- [ ] Added `TELEGRAM_CHAT_ID` to `agent/.env`
- [ ] Tested: Bot sends test message

## 🧪 Verification

- [ ] Ran `node verify-setup.js` and all checks passed
- [ ] Frontend displays empty feed (expected initially)
- [ ] Agent logs show scrapers running
- [ ] Checked Supabase Table Editor - `opportunities` table has data
- [ ] Refreshed frontend feed - opportunities appear
- [ ] Clicked an opportunity - marks as "seen"
- [ ] Tested navigation to all pages
- [ ] No console errors in browser

## 🚀 Deployment (Optional)

### Frontend (Vercel)
- [ ] Connected GitHub repo to Vercel
- [ ] Added environment variables in Vercel dashboard
- [ ] Deployed successfully
- [ ] Visited production URL
- [ ] All features work in production

### Agent (Railway/Render)
- [ ] Created Railway/Render account
- [ ] Created new worker service
- [ ] Connected GitHub repo
- [ ] Added all environment variables
- [ ] Deployed successfully
- [ ] Health check works: `https://your-agent.railway.app/health`
- [ ] Logs show scraping running

### Database (Already done!)
- [ ] Using Supabase (no additional deployment needed)

## 📊 Monitoring

- [ ] Bookmarked Supabase dashboard
- [ ] Bookmarked agent logs (Railway/Render dashboard)
- [ ] Set up email notifications for critical errors (optional)
- [ ] Verified cron jobs are running:
  - [ ] Scraping every 6 hours
  - [ ] Daily digest at 9 AM
  - [ ] Deadline check at 8 AM

## 🎯 First Use

- [ ] Opened feed page
- [ ] Saw opportunities from scrapers
- [ ] Applied filters (internship, remote, etc.)
- [ ] Clicked "View posting" on an opportunity
- [ ] Marked an opportunity as "seen"
- [ ] Went to Tracker page
- [ ] Created a test application record
- [ ] Went to Settings page
- [ ] Configured notification preferences
- [ ] Went to Resume page
- [ ] Tested resume analyzer (if Anthropic key added)

## 🐛 Troubleshooting

If something doesn't work:

- [ ] Checked browser console for errors
- [ ] Checked agent logs for errors
- [ ] Verified environment variables are correct
- [ ] Verified Supabase project is not paused
- [ ] Verified API keys are valid
- [ ] Restarted both frontend and agent
- [ ] Cleared browser cache
- [ ] Checked QUICKSTART.md for solutions

## 📚 Documentation Read

- [ ] Read README.md
- [ ] Read QUICKSTART.md
- [ ] Skimmed ARCHITECTURE.md
- [ ] Bookmarked DEPLOYMENT.md for later
- [ ] Reviewed TODO.md for future features

---

## ✨ Final Check

**All critical items checked?** 

If yes → You're ready to start tracking opportunities! 🎉

If no → Review the unchecked items above and refer to:
- QUICKSTART.md for setup help
- DEPLOYMENT.md for production deployment
- GitHub Issues for specific problems

---

**Time to completion**: ~30 minutes for full setup with all integrations

**Minimum viable setup**: ~10 minutes (just frontend + agent + Supabase)
