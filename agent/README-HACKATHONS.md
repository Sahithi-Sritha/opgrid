# Hackathon & Fellowship Scrapers

OpGrid now includes comprehensive scraping for hackathons, competitions, and fellowships that can lead to internships or PPO opportunities.

## New Features

### Database Updates
- Added new source types: `hackathon`, `fellowship`, `competition`
- New category field: `internship` | `hackathon` | `fellowship` | `competition` | `research`
- New columns:
  - `prize_pool` - Prize money (e.g. "₹5,00,000")
  - `team_size` - Team size requirements (e.g. "1-4")
  - `ppo_possible` - Boolean flag for PPO conversion potential
  - `registration_open` - Registration status
  - `event_date` - Event/hackathon start date

### Scrapers Included

#### 1. Unstop (unstopScraper.ts)
- **Sources**: https://unstop.com/hackathons, https://unstop.com/competitions
- **Technology**: Playwright (JS-rendered)
- **Features**:
  - Scrolls to load all cards
  - Clicks "Load more" (max 5 pages)
  - Auto-detects PPO opportunities
  - Extracts prizes, deadlines, team sizes

#### 2. HackerEarth (hackearthScraper.ts)
- **Source**: https://www.hackerearth.com/challenges/
- **Technology**: Axios + Cheerio
- **Features**:
  - Filters hackathons and hiring challenges
  - Flags hiring challenges for PPO potential
  - Categorizes by prize presence

#### 3. HackCulture (hackCultureScraper.ts)
- **Source**: https://hackculture.in/hackathons
- **Technology**: Playwright
- **Features**:
  - Detects online/offline mode
  - Extracts event dates
  - Prize pool parsing

#### 4. lablab.ai (labLabScraper.ts)
- **Source**: https://lablab.ai/event
- **Technology**: Axios + Cheerio
- **Features**:
  - AI hackathon focus
  - Auto-tags with 'ai_hackathon'
  - Extracts AI tools used

#### 5. Devfolio (devfolioScraper.ts)
- **Source**: https://devfolio.co/hackathons
- **Technology**: Playwright
- **Features**:
  - Filters open hackathons
  - Team size extraction
  - Prize pool parsing

#### 6. MLH (mlhScraper.ts)
- **Source**: https://mlh.io/seasons/2026/events
- **Technology**: Axios + Cheerio
- **Features**:
  - Static page scraping
  - Online/in-person detection
  - Auto-tags with 'mlh'

#### 7. MyCareerNet (myCareerNetScraper.ts)
- **Source**: https://www.mycareernetwork.co.in/internships
- **Technology**: Playwright
- **Features**:
  - Public internship listings
  - Stipend extraction
  - Duration tracking

#### 8. Internshala Hackathons (internshalaHackathonScraper.ts)
- **Source**: https://internshala.com/hackathons/
- **Technology**: Axios + Cheerio
- **Features**:
  - Prize pool extraction
  - Deadline parsing
  - Company extraction

#### 9. Fellowships (fellowshipScraper.ts)
- **Config-driven** from `config/fellowships.json`
- **Sources**:
  - MLH Fellowship
  - Google Summer of Code (GSoC)
  - Outreachy
  - LFX Mentorship
  - Microsoft Engage
  - Google STEP
  - Amazon Propel
- **Features**:
  - Static config for reliable sources
  - Marks all as PPO-possible
  - Cycle-based tagging (annual, rolling, etc.)

## Enhanced AI Classification

### New Tags
- `ppo_possible` - Can lead to PPO/full-time offer
- `ai_hackathon` - AI/ML focused event
- `fellowship` - Fellowship program
- `mlh` - Major League Hacking event
- `gsoc_style` - Similar to Google Summer of Code
- `prize_high` - Prize > ₹1,00,000 or $1,000
- `team_event` - Team participation
- `solo_event` - Individual participation
- `beginner_friendly` - Open to beginners

## Scheduling

### Cron Jobs
- **Internships**: Every 6 hours (`0 */6 * * *`)
- **Hackathons**: Every 3 hours (`0 */3 * * *`) - faster because they change more
- **Daily Digest**: 9 AM daily (`0 9 * * *`)
- **Deadline Check**: 8 AM daily (`0 8 * * *`)

## API Endpoints

### Manual Triggers
```bash
# Trigger internship scraping
POST http://localhost:3001/trigger-scrape

# Trigger hackathon scraping
POST http://localhost:3001/trigger-hackathons
```

## Setup

### 1. Install Dependencies
```bash
cd agent
npm install
# Playwright will be installed automatically
```

### 2. Install Playwright Browsers
```bash
npx playwright install chromium
```

### 3. Run Migration
Execute `schema-migration-hackathons.sql` in your Supabase SQL Editor.

### 4. Run Agent
```bash
npm run dev
```

The agent will scrape both internships and hackathons on startup.

## Usage Examples

### Query Hackathons
```javascript
const { data } = await supabase
  .from('opportunities')
  .select('*')
  .eq('category', 'hackathon')
  .eq('registration_open', true)
  .order('event_date', { ascending: true })
```

### Query PPO Opportunities
```javascript
const { data } = await supabase
  .from('opportunities')
  .select('*')
  .eq('ppo_possible', true)
  .order('created_at', { ascending: false })
```

### Query High-Prize Events
```javascript
const { data } = await supabase
  .from('opportunities')
  .select('*')
  .contains('tags', ['prize_high'])
  .order('event_date', { ascending: true })
```

## Frontend Integration

Add these filters to `frontend/app/feed/page.tsx`:

```typescript
const filters = [
  'all', 'internship', 'hackathon', 'fellowship',
  'ppo_possible', 'ai_hackathon', 'prize_high', 'beginner_friendly'
]
```

## Performance

- Average scrape time: 2-5 minutes per run
- Hackathon scrapers run more frequently (3 hours vs 6 hours)
- Playwright scrapers are slower but handle JS-rendered sites
- Total ~8 scrapers per hackathon run

## Monitoring

Check agent logs for scraping status:
```
🎯 Starting hackathon & fellowship scrapers...
  → Running Unstop scraper...
    ✓ New: HackIndia 2026 at TechCorp
  → Running HackerEarth scraper...
    ✓ New: AI Challenge at Google
✅ Hackathon scraping complete. Found 15 new opportunities.
```

## Troubleshooting

### Playwright Issues
```bash
# Reinstall browsers
npx playwright install --force chromium
```

### Slow Scraping
- Playwright scrapers take 30-60s each
- Consider running in parallel (future enhancement)

### Missing Data
- Some sites may have changed their HTML structure
- Check scrapers and update selectors

## Future Enhancements

- [ ] Add more sources (Codeforces, LeetCode contests)
- [ ] Parallel scraping for speed
- [ ] Proxy rotation for rate limiting
- [ ] Screenshot capture for verification
- [ ] Calendar integration for event dates
- [ ] Notification customization per category

## Contributing

See main `CONTRIBUTING.md` for guidelines on adding new scrapers.
