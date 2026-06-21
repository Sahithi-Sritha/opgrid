# 🧪 Integration Testing Checklist

Quick checklist to verify all Task 5 features are working correctly.

---

## ⚡ Quick Start

### 1. Start Both Servers
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# → http://localhost:3000

# Terminal 2 - Agent
cd agent
npm run dev
# → http://localhost:3001
```

### 2. Verify Backend Routes
```bash
# Health check
curl http://localhost:3001/health

# Scraper health
curl http://localhost:3001/api/scrapers/health

# Expected: JSON with scraper status
```

---

## ✅ Test Command Palette

### Test 1: Open Palette
1. Go to any page: http://localhost:3000/feed
2. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows)
3. ✅ **Expected**: Modal opens with search input

### Test 2: Fuzzy Search
1. Open command palette (Cmd+K)
2. Type a company name or role (e.g., "Google")
3. ✅ **Expected**: Opportunities matching "Google" appear
4. Click one
5. ✅ **Expected**: Navigates to opportunity or opens slide-over

### Test 3: Intent Detection - Apply
1. Open command palette (Cmd+K)
2. Type: "I applied to [company name]"
3. Press Enter
4. ✅ **Expected**: Creates application in tracker
5. Verify in: http://localhost:3000/tracker

### Test 4: Intent Detection - Navigation
1. Open command palette (Cmd+K)
2. Type: "Show deadlines"
3. ✅ **Expected**: Navigates to dashboard
4. Alternative: Type "Resume" → navigates to resume page

### Test 5: Close Palette
1. Open palette (Cmd+K)
2. Press **Esc**
3. ✅ **Expected**: Palette closes

---

## ✅ Test Opportunity Slide-Over

### Test 1: Open from Feed
1. Go to: http://localhost:3000/feed
2. Wait for opportunities to load
3. **Click any opportunity card**
4. ✅ **Expected**: Right panel slides in with full details

### Test 2: View Details
1. Open any opportunity slide-over
2. ✅ **Verify visible**:
   - Company name + logo placeholder
   - Role title
   - Full description (scrollable)
   - Tags/badges
   - Deadline (if present)
   - Progress bar showing time elapsed

### Test 3: Action - I Applied
1. Open opportunity slide-over
2. Click **"I applied!"** button
3. ✅ **Expected**: 
   - Success message/toast
   - Application created in database
4. Verify: Check http://localhost:3000/tracker

### Test 4: Action - Save for Later
1. Open opportunity slide-over
2. Click **"Save for later"** button
3. ✅ **Expected**: Saved to `saved_opportunities` table
4. Verify in Supabase dashboard

### Test 5: Action - Analyze JD
1. Open opportunity slide-over
2. Click **"Analyze JD"** button
3. ✅ **Expected**: Navigate to /resume with JD pre-filled

### Test 6: Similar Opportunities
1. Open opportunity slide-over
2. Scroll to bottom
3. ✅ **Expected**: List of similar opportunities (if any)
4. Click one → opens that opportunity

### Test 7: Close Slide-Over
1. Open slide-over
2. Click **X** button or click outside panel
3. ✅ **Expected**: Slide-over closes

---

## ✅ Test Scraper Health Dashboard

### Test 1: Navigate to Tab
1. Go to: http://localhost:3000/settings
2. Click **"Scraper Health"** tab
3. ✅ **Expected**: Table loads with scraper data

### Test 2: View Scraper Status
1. In Scraper Health tab
2. ✅ **Verify table shows**:
   - Scraper Name
   - Last Run (time ago)
   - Status (✓ Success or ✗ Error)
   - New Found (count)
   - Duration (seconds)
   - "Run Now" button

### Test 3: Manual Trigger
1. Click **"Run Now"** on any scraper
2. ✅ **Expected**: 
   - Button shows loading state
   - After 2-3 seconds, table refreshes
   - Last Run updates to "a few seconds ago"
   - New Found count may increase

### Test 4: Refresh Status
1. Click **"Refresh"** button at top
2. ✅ **Expected**: Table reloads with latest data

### Test 5: View Errors
1. If any scraper has errors (red ✗)
2. ✅ **Expected**: Error message box appears below table
3. Shows scraper name + error message

---

## ✅ Test Telegram Follow-Up Webhook

### Setup (One-time)
```bash
# Set your Telegram webhook URL
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=http://your-ngrok-url.ngrok.io/api/telegram/webhook"

# For local testing, use ngrok:
ngrok http 3001
# Then set webhook to: https://xxxx.ngrok.io/api/telegram/webhook
```

### Test 1: Create Application
1. In UI, apply to a job (any method)
2. Verify application created in tracker
3. In Supabase, set `applied_date` to 8 days ago:
```sql
UPDATE applications 
SET applied_date = (CURRENT_DATE - INTERVAL '8 days')
WHERE id = 'your-app-id';
```

### Test 2: Trigger Follow-Up Check
```bash
# Manually trigger (or wait for 10 AM cron)
# In agent code, call:
node -e "require('./dist/scheduler/deadlines').checkFollowUps()"
```

### Test 3: Receive Telegram Message
1. ✅ **Expected**: Telegram bot sends:
   > "👋 Did you follow up on [Role] at [Company]? It's been 7 days."

### Test 4: Confirm Follow-Up
1. Reply to bot: "yes" or "done" or "sent"
2. ✅ **Expected**: Bot replies:
   > "Got it! ✅ Marked follow-up sent for [Role] at [Company]."
3. Verify in database:
```sql
SELECT follow_up_sent, follow_up_date 
FROM applications 
WHERE id = 'your-app-id';
-- follow_up_sent should be TRUE
```

---

## ✅ Test Deduplication

### Test 1: Create Duplicate Opportunities
```sql
-- In Supabase SQL Editor
INSERT INTO opportunities (title, company, source, url, tags, location)
VALUES 
  ('Software Engineer Intern', 'Google', 'linkedin', 'https://example.com/job1', ARRAY['internship'], 'Remote'),
  ('SWE Intern', 'Google', 'wellfound', 'https://example.com/job2', ARRAY['internship'], 'Remote');
```

### Test 2: Run Deduplication
```bash
# Manual trigger
curl -X POST http://localhost:3001/api/opportunities/deduplicate
```

### Test 3: Verify Results
1. ✅ **Expected response**:
```json
{
  "duplicates_found": 1,
  "merged": 1,
  "stale_marked": 0,
  "message": "Deduplication complete: 1 merged, 0 marked stale"
}
```

### Test 4: Check Database
```sql
-- Only one Google intern opportunity should remain
SELECT * FROM opportunities WHERE company = 'Google';
-- Should return only 1 row
```

### Test 5: Test Stale Marking
```sql
-- Create old opportunity with passed deadline
INSERT INTO opportunities (title, company, source, url, deadline, created_at, tags)
VALUES ('Old Hackathon', 'TestCo', 'unstop', 'https://example.com/old', 
        (CURRENT_DATE - INTERVAL '10 days'), 
        (CURRENT_TIMESTAMP - INTERVAL '3 days'),
        ARRAY['hackathon']);

-- Run deduplication
-- Expected: registration_open set to FALSE
```

---

## ✅ Test Global Components

### Test 1: Notification Bell (Layout)
1. Go to any page
2. ✅ **Verify**: Bell icon visible in top-right
3. Click bell
4. ✅ **Expected**: Dropdown with notifications (if any)

### Test 2: Command Palette (Global)
1. From any page, press Cmd+K
2. ✅ **Expected**: Palette opens
3. Works on: /feed, /tracker, /resume, /settings, /dashboard

### Test 3: Slide-Over (From Multiple Pages)
1. Open opportunity from feed → slide-over works
2. Open opportunity from dashboard → slide-over works
3. Open opportunity from command palette → slide-over works
4. ✅ **Expected**: Consistent behavior everywhere

---

## ✅ Integration Flow Tests

### Flow 1: Discovery → Apply → Track
1. **Feed**: Browse opportunities
2. **Click** opportunity card → Slide-over opens
3. **Click** "I applied!" → Application created
4. **Navigate** to /tracker → See application
5. ✅ **Success**: End-to-end flow works

### Flow 2: Search → Apply → Follow-Up
1. **Cmd+K** → Type company name
2. **Select** opportunity → Opens slide-over
3. **Apply** → "I applied!" button
4. **Wait** 7 days (or fake applied_date)
5. **Receive** Telegram reminder
6. **Reply** "done" → Follow-up marked
7. ✅ **Success**: Full automation chain works

### Flow 3: Monitor → Trigger → Verify
1. **Settings** → Scraper Health tab
2. **Click** "Run Now" on scraper
3. **Wait** for completion
4. **Refresh** → Status updated
5. **Navigate** to /feed → New opportunities appear
6. ✅ **Success**: Monitoring → execution → verification works

---

## 🐛 Common Issues & Fixes

### Issue: Command Palette Not Opening
**Fix**: Check browser console for errors. Verify `CommandPalette.tsx` is imported in `layout.tsx`.

### Issue: Slide-Over Not Opening
**Fix**: 
1. Check `OpportunitySlideOver.tsx` is in `layout.tsx`
2. Verify feed cards have `onClick` handler
3. Check browser console for event errors

### Issue: Scraper Health Shows Empty
**Fix**: 
1. Trigger a scraper manually: `POST /api/scrapers/run?scraper=all_internships`
2. Wait 2 seconds, refresh
3. Check `scraper_runs` table in Supabase has entries

### Issue: Telegram Webhook Not Working
**Fix**:
1. Verify webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
2. Check ngrok is running (for local testing)
3. Verify `TELEGRAM_BOT_TOKEN` in agent `.env`

### Issue: Deduplication Not Merging
**Fix**:
1. Check `ANTHROPIC_API_KEY` is set
2. Verify opportunities have similar titles
3. Check Claude API quota/limits
4. Review console logs for Claude errors

---

## 📊 Success Criteria

All features working if:

✅ **Command Palette**: Opens with Cmd+K, searches work, intents execute  
✅ **Slide-Over**: Opens on click, shows details, actions work  
✅ **Scraper Health**: Table loads, manual triggers work, status updates  
✅ **Telegram Webhook**: Receives messages, parses intents, updates DB  
✅ **Deduplication**: Finds duplicates, merges correctly, marks stale  
✅ **Global Components**: Accessible from all pages, consistent behavior  

---

## 🎯 Quick Smoke Test (2 minutes)

```bash
# 1. Start servers
cd frontend && npm run dev &
cd agent && npm run dev &

# 2. Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/scrapers/health

# 3. Open browser
open http://localhost:3000/feed

# 4. Quick checks
# - Press Cmd+K → Palette opens ✅
# - Click opportunity → Slide-over opens ✅
# - Go to Settings → Scraper Health tab shows table ✅

# 5. All good? ✅ Integration complete!
```

---

## 📝 Notes

- Some tests require data in database (run scrapers first)
- Telegram tests require ngrok for local development
- Deduplication tests need Claude API access
- Follow-up tests require manipulating applied_date manually

---

**All tests passing? 🎉 Integration is complete and working!**

For issues, check:
- `INTEGRATION_COMPLETE.md` - Feature details
- `FINAL_STATUS.md` - Complete status
- `ARCHITECTURE.md` - How it works
