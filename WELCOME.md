# 🎉 Welcome to OpGrid!

Congratulations! You've just created a **production-ready internship opportunity aggregator**.

## 🎯 What You Have

A complete full-stack application with:

✅ **Next.js 14 Frontend** - Modern React with App Router  
✅ **Express Agent** - 24/7 background scraping worker  
✅ **Supabase Database** - PostgreSQL with real-time capabilities  
✅ **AI-Powered Tagging** - Anthropic Claude integration  
✅ **Multi-Source Scraping** - LinkedIn, Wellfound, YC, Telegram, career pages  
✅ **Smart Notifications** - Email digests + Telegram alerts  
✅ **Application Tracker** - Full pipeline management  
✅ **Resume Analyzer** - AI-powered JD matching  

## 📦 What's Included

**43 files created** across:
- Frontend pages (Feed, Tracker, Resume, Settings)
- Backend scrapers (5 sources)
- Database schema (4 tables)
- Notification system (Email + Telegram)
- Complete documentation (12 guides)

## 🚀 Your Next 3 Minutes

### 1. Choose Your Path

**Path A: Quick Test (5 min)**
```bash
# Just want to see it work?
→ Read START_HERE.md
```

**Path B: Full Setup (10 min)**
```bash
# Want everything configured?
→ Read QUICKSTART.md
```

**Path C: Understanding First**
```bash
# Want to know how it works?
→ Read ARCHITECTURE.md
```

### 2. Essential Setup

No matter which path, you'll need:

1. **Supabase account** (free) → https://supabase.com
2. **Run schema.sql** in Supabase SQL Editor
3. **Configure .env files** with your credentials
4. **Install dependencies** (`npm install` in both folders)

That's it! Then just `npm run dev` in both frontend and agent.

## 📚 Documentation Guide

**Not sure where to start?** Here's the recommended reading order:

### First-Time Setup
1. 📍 **START_HERE.md** - Start here if confused
2. 🚀 **QUICKSTART.md** - Detailed setup walkthrough
3. ✅ **CHECKLIST.md** - Verify everything works

### Understanding the System
4. 📖 **README.md** - Project overview and features
5. 🏗️ **ARCHITECTURE.md** - How it all works together
6. 🗺️ **PROJECT_MAP.md** - Navigate the codebase

### Going to Production
7. 🚢 **DEPLOYMENT.md** - Deploy to Vercel + Railway
8. 💰 Cost: ~$10-15/month

### Contributing & Extending
9. 🤝 **CONTRIBUTING.md** - Add new scrapers
10. 📋 **TODO.md** - Feature wishlist

### Reference
11. 📊 **PROJECT_SUMMARY.md** - Complete overview
12. 📄 **LICENSE** - MIT (free to use!)

## 🎓 Learning Path

### Beginner (Never deployed before?)
1. Follow QUICKSTART.md exactly
2. Get it running locally first
3. Test all features manually
4. Read ARCHITECTURE.md to understand
5. Deploy when comfortable

### Intermediate (Have deployed before?)
1. Skim START_HERE.md
2. Configure environment variables
3. Run locally to test
4. Read DEPLOYMENT.md
5. Deploy to Vercel + Railway

### Advanced (Want to extend it?)
1. Read ARCHITECTURE.md
2. Read CONTRIBUTING.md
3. Check TODO.md for ideas
4. Add new scrapers/features
5. Submit a PR!

## 🔑 Required Services

| Service | Cost | Required? | Get It |
|---------|------|-----------|--------|
| **Supabase** | Free | ✅ Yes | [supabase.com](https://supabase.com) |
| **Anthropic** | ~$10/mo | ⚠️ Optional | [console.anthropic.com](https://console.anthropic.com) |
| **Resend** | Free | ⚠️ Optional | [resend.com](https://resend.com) |
| **Telegram** | Free | ⚠️ Optional | @BotFather |

**Minimum**: Just Supabase (can test without AI/notifications)

## ⚡ Quick Commands

```bash
# Setup
npm install                     # In both frontend/ and agent/
node verify-setup.js           # Check if everything is ready

# Development
cd frontend && npm run dev     # Frontend on :3000
cd agent && npm run dev        # Agent on :3001

# Build for production
cd frontend && npm run build   # Next.js production build
cd agent && npm run build      # TypeScript compilation

# Deploy
vercel --prod                  # Frontend to Vercel
railway up                     # Agent to Railway
```

## 🎯 First-Time User Flow

1. **Open frontend** → http://localhost:3000
2. **See empty feed** (expected - no data yet)
3. **Agent scrapes** (runs on startup, then every 6 hours)
4. **Refresh feed** → Opportunities appear!
5. **Filter by tags** → Click "internship", "remote", etc.
6. **Click opportunity** → Opens external link
7. **Go to Tracker** → Add application record
8. **Go to Settings** → Configure notifications
9. **Wait for digest** → Email at 9 AM daily

## 🏆 Success Metrics

You'll know it's working when:

✓ Frontend loads at localhost:3000  
✓ Agent logs show "Starting scrapers..."  
✓ Supabase table has opportunity records  
✓ Feed page displays opportunities  
✓ Can filter by tags  
✓ Tracker page works  
✓ No console errors  

## 🐛 Common Issues

### "Can't connect to Supabase"
→ Check you're using SERVICE_KEY in agent (not anon key)

### "No opportunities showing"
→ Wait 30 seconds for initial scrape, then refresh

### "TypeScript errors"
→ Run `npm install` again in both folders

### "Port already in use"
→ Kill existing process: `npx kill-port 3000` or `3001`

### "Environment variables not found"
→ Ensure `.env.local` (frontend) and `.env` (agent) exist

## 💡 Pro Tips

🔥 **Hot Reload**: Both frontend and agent support hot reload  
📝 **Logs**: Watch agent terminal for scraping status  
🔍 **Debug**: Use Supabase Table Editor to see raw data  
🎨 **Customize**: Edit Tailwind classes to change styling  
🤖 **Test AI**: Use OpenAI playground to prototype prompts  

## 🎁 Bonus Features

Already included but you might not know:

- **PWA Support** - Can be installed as mobile app
- **Dark Mode Ready** - Tailwind dark mode classes
- **Real-time Capable** - Supabase real-time ready
- **Type-Safe** - Full TypeScript everywhere
- **SEO Ready** - Next.js metadata API
- **Responsive** - Mobile-friendly design

## 🚀 Ready to Start?

Pick one:

→ **"Just show me how to run it"**: Read **START_HERE.md**  
→ **"I want the full experience"**: Read **QUICKSTART.md**  
→ **"How does this even work?"**: Read **ARCHITECTURE.md**  
→ **"Let me explore myself"**: Check **PROJECT_MAP.md**  

## 🆘 Need Help?

1. Check the relevant documentation file
2. Run `node verify-setup.js` to diagnose issues
3. Review error messages in agent logs
4. Check Supabase dashboard for database issues
5. Open an issue on GitHub (if applicable)

## 📊 Project Stats

```
📁 Files Created:     43
📄 Documentation:     12 guides
🎨 Frontend Pages:    4 pages
🤖 Scrapers:          5 sources
📊 Database Tables:   4 tables
⏱️ Setup Time:        10-30 minutes
💰 Monthly Cost:      $10-60
```

## 🎉 You're All Set!

Everything you need is documented. The codebase is yours to explore and extend.

**Time to build something amazing!** 🚀

---

<div align="center">

### 📍 Not Sure Where to Go?

**→ Start Here**: [START_HERE.md](START_HERE.md)  
**→ Quick Setup**: [QUICKSTART.md](QUICKSTART.md)  
**→ Full Map**: [PROJECT_MAP.md](PROJECT_MAP.md)  

</div>

---

<div align="center">

**Built for the job search grind.**  
**Open source. Actually useful.**  
**Made with ❤️ for students.**

🎯

</div>
