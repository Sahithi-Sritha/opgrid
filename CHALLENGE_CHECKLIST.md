# Weekend Challenge Submission Checklist

Use this to track your progress toward submission.

## ✅ Eligibility Requirements

### AWS Integration (REQUIRED)
- [ ] Amazon Bedrock enabled in AWS account
- [ ] Claude 3 Haiku model access granted
- [ ] AWS credentials added to `agent/.env`
- [ ] Agent successfully classifying opportunities via Bedrock
- [ ] Can see Bedrock API calls in CloudWatch or Bedrock console

### Article Requirements (500+ words, ALL sections required)

- [ ] **Title**: Includes "Weekend Annoying Task Challenge: OpGrid"
- [ ] **Tag**: Added `#productivity` tag

#### Content Sections:
- [ ] **Vision & What the app does** (100+ words)
  - [ ] Problem description
  - [ ] Solution overview
  - [ ] Key features

- [ ] **How You Built It** (150+ words)
  - [ ] Development timeline
  - [ ] Key decisions
  - [ ] Challenges & solutions

- [ ] **AWS Services Used / Architecture Overview** (100+ words)
  - [ ] List: Amazon Bedrock (Claude 3 Haiku)
  - [ ] Architecture diagram included
  - [ ] Explanation of how agent is triggered (cron → scrape → Bedrock → classify)

- [ ] **What You Learned** (100+ words)
  - [ ] Technical skills gained
  - [ ] Product insights
  - [ ] Unexpected challenges

- [ ] **Link to App or Repo** (REQUIRED)
  - [ ] Live app URL (Vercel): `https://_____.vercel.app`
  - [ ] OR GitHub repo (public): `https://github.com/_____/opgrid`

### Word Count
- [ ] Article is 500+ words (use word counter)

---

## 🎨 Supporting Materials

### Screenshots (recommended, not required)
- [ ] Feed page showing tagged opportunities
- [ ] AWS Bedrock console showing model invocations
- [ ] CloudWatch logs showing API calls
- [ ] Tracker page (optional)

### Architecture Diagram
- [ ] Diagram shows: Frontend → Database → Agent → Bedrock
- [ ] Clear flow from user to AWS service
- [ ] Labels AWS service prominently

---

## 🚀 Pre-Submission Checklist

### Code & Deployment
- [ ] GitHub repo is PUBLIC
- [ ] README mentions Amazon Bedrock
- [ ] `.env.example` updated with AWS variables
- [ ] Agent deployed to Railway/Render with AWS credentials
- [ ] Frontend deployed to Vercel (working)
- [ ] Database (Supabase) has opportunities with tags

### Testing
- [ ] Manually triggered scraper - works ✅
- [ ] Opportunities getting auto-tagged by Bedrock ✅
- [ ] Can verify Bedrock usage in AWS Console ✅
- [ ] No errors in Railway/Render logs ✅

### Article
- [ ] Article drafted in AWS Builder Center
- [ ] All sections complete
- [ ] Screenshots uploaded
- [ ] Links tested (GitHub, live app)
- [ ] Spell-checked
- [ ] Saved as DRAFT (don't publish until ready!)

---

## 📋 Submission Timeline

**Target: Submit before August 3, 2026 @ 1:00 PM PT**

### Day 1 (Now)
- [x] Code changes complete (Bedrock integration)
- [ ] AWS account created
- [ ] Bedrock enabled
- [ ] Testing locally

### Day 2
- [ ] Deploy to Railway/Render with AWS env vars
- [ ] Verify production usage
- [ ] Take screenshots
- [ ] Draft article

### Day 3 (Deadline Day)
- [ ] Finalize article
- [ ] Double-check all links
- [ ] Publish to AWS Builder Center
- [ ] Submit before 1 PM PT ⏰

---

## 🎯 Final Validation

Before hitting publish, verify:

### Completeness ✅
- [ ] 500+ words ✅
- [ ] All 5 sections present ✅
- [ ] Working link (app or repo) ✅

### Relevance & Functionality ✅
- [ ] Actually works (not just a concept) ✅
- [ ] Solves the "annoying task" (job hunting) ✅
- [ ] Productive/useful ✅

### AWS Service Usage ✅
- [ ] Uses Amazon Bedrock ✅
- [ ] Clearly described in article ✅
- [ ] Shown in architecture diagram ✅

---

## 🏆 Post-Submission

After publishing your article:

- [ ] Note your submission timestamp
- [ ] Check article is live on AWS Builder Center
- [ ] Share on social media (optional)
- [ ] Wait for email notification from AWS (within 2 weeks)

---

## 📞 Need Help?

Stuck? Check these files:
- **Setup**: `AWS_SETUP_10MIN.md`
- **Article template**: `WEEKEND_CHALLENGE_ARTICLE.md`
- **Architecture**: `ARCHITECTURE.md`

Common issues:
- Bedrock access denied → Enable model in AWS Console
- Agent using Gemini not Bedrock → Check `AWS_REGION` env var is set
- Can't verify Bedrock usage → Check CloudWatch Logs in us-east-1

---

**You got this! 🚀 First 73 to submit = automatic jacket win!**
