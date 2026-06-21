# 🚀 Hackathon Features - Quick Start

Get OpGrid's hackathon & fellowship scraping running in 5 minutes!

## ⚡ Quick Setup

### 1. Run Database Migration (1 min)

Copy and run this in Supabase SQL Editor:

```sql
-- Add new source types
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_source_check;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_source_check 
    CHECK (source IN ('linkedin', 'wellfound', 'yc', 'telegram', 'career_page', 'hackathon', 'fellowship', 'competition'));

-- Add new columns
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS category TEXT 
    CHECK (category IN ('internship', 'hackathon', 'fellowship', 'competition', 'research'));
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS prize_pool TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ppo_possible BOOLEAN DEFAULT false;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS event_date DATE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_ppo_possible ON opportunities(ppo_possible) WHERE ppo_possible = true;
```

✅ Done? Your database is ready!

### 2. Install Playwright (2 min)

```bash
cd agent
npm install playwright
npx playwright install chromium
```

✅ Playwright browsers installed!

### 3. Restart Agent (1 min)

```bash
# Kill existing agent
# Then restart:
npm run dev
```

Watch the logs:
```
🚀 OpGrid Agent running on port 3001
✅ Cron jobs scheduled
  - Internships: every 6 hours
  - Hackathons: every 3 hours  ← NEW!
  - Digest: 9 AM daily
  - Deadlines: 8 AM daily

🔍 Starting internship scrapers...
🎯 Starting hackathon & fellowship scrapers...  ← NEW!
  → Running Unstop scraper...
  → Running HackerEarth scraper...
  ...
✅ Hackathon scraping complete. Found 15 new opportunities.
```

✅ Agent is scraping hackathons!

### 4. Check Frontend (30 sec)

Open http://localhost:3000/feed

You should now see:
- ✅ New filter buttons: `hackathon`, `fellowship`, `ppo_possible`, `ai_hackathon`, `prize_high`
- ✅ Hackathon cards with 🏆 prize pools
- ✅ Event dates with 📅 calendar icons
- ✅ ⭐ PPO badges on eligible opportunities

## 🎯 What You Get

### Sources Tracked
- ✅ Unstop hackathons & competitions
- ✅ HackerEarth challenges
- ✅ HackCulture events
- ✅ lablab.ai AI hackathons
- ✅ Devfolio hackathons
- ✅ MLH events
- ✅ MyCareerNet internships
- ✅ Internshala hackathons
- ✅ Fellowships (GSoC, Outreachy, LFX, etc.)

### Auto-Detected
- 🏆 Prize pools (₹ and $)
- 👥 Team size requirements
- ⭐ PPO conversion potential
- 📅 Event dates
- 🏷️ Smart tags (AI, beginner-friendly, etc.)

## 💡 Usage Examples

### Find PPO Opportunities
Click the `ppo_possible` filter button

### Find AI Hackathons
Click the `ai_hackathon` filter button

### Find High-Prize Events
Click the `prize_high` filter button (Prize > ₹1L)

### Find Fellowships
Click the `fellowship` filter button

## 🔧 Manual Test

### Trigger Hackathon Scraping Now

```bash
curl -X POST http://localhost:3001/trigger-hackathons
```

### Check Results

```sql
-- In Supabase SQL Editor
SELECT title, company, category, prize_pool, ppo_possible
FROM opportunities
WHERE category IN ('hackathon', 'fellowship', 'competition')
ORDER BY created_at DESC
LIMIT 10;
```

## 📊 Scheduling

Your agent now runs:

| What | Frequency | Cron | Reason |
|------|-----------|------|--------|
| Internships | Every 6 hours | `0 */6 * * *` | Standard refresh |
| **Hackathons** | **Every 3 hours** | `0 */3 * * *` | **Faster changes** |
| Daily digest | 9 AM daily | `0 9 * * *` | Morning summary |
| Deadlines | 8 AM daily | `0 8 * * *` | Deadline alerts |

## 🎨 Frontend Filters

### Before
```
all | internship | remote | stipend | OA | referral
```

### After
```
all | internship | hackathon | fellowship | remote | stipend
ppo_possible | ai_hackathon | prize_high | beginner_friendly
```

## ✅ Verification Checklist

- [ ] Database migration ran successfully
- [ ] Playwright installed (`npx playwright --version`)
- [ ] Agent shows "🎯 Starting hackathon scrapers..."
- [ ] Frontend shows new filter buttons
- [ ] Feed displays hackathon opportunities
- [ ] Prize pools are visible (🏆)
- [ ] Event dates are shown (📅)
- [ ] PPO badges appear (⭐)

## 🐛 Troubleshooting

### "Playwright not found"
```bash
npm install playwright
npx playwright install chromium
```

### "No hackathons appearing"
```bash
# Manually trigger
curl -X POST http://localhost:3001/trigger-hackathons

# Check logs for errors
# Wait 1-2 minutes for scraping to complete
```

### "Database error"
Make sure you ran the migration SQL in Supabase SQL Editor

### "Frontend filters not showing"
Make sure you restarted the frontend after code changes

## 📚 Full Documentation

- **agent/README-HACKATHONS.md** - Complete scraper docs
- **HACKATHON_EXTENSION_SUMMARY.md** - Technical overview
- **schema-migration-hackathons.sql** - Database changes

## 🎉 You're Done!

OpGrid now tracks:
- ✅ Internships (LinkedIn, Wellfound, YC, etc.)
- ✅ Hackathons (Unstop, HackerEarth, Devfolio, etc.)
- ✅ Fellowships (GSoC, Outreachy, MLH, etc.)
- ✅ Competitions (HackerEarth, CodeChef, etc.)

**All automatically scraped, tagged, and notified!** 🚀

---

## 🔥 Pro Tips

1. **PPO Hunting**: Filter by `ppo_possible` to find opportunities that convert to full-time
2. **AI Focus**: Use `ai_hackathon` for ML/AI events
3. **Big Prizes**: Sort by `prize_high` for major prizes (> ₹1L)
4. **Beginners**: Filter `beginner_friendly` for welcoming events
5. **Calendar View**: Sort by `event_date` for upcoming events

**Happy hackathon hunting!** 🎯
