# Screenshot Guide for Article

Take these screenshots to make your submission stand out.

## 📸 Essential Screenshots (Take These!)

### 1. Feed Dashboard (MUST HAVE)
**What to show**: Your main feed with opportunities

**How to capture**:
1. Open your live app: `https://your-app.vercel.app/feed`
2. Make sure you have 10+ opportunities showing
3. Scroll to show variety (different companies, tags, etc.)
4. Screenshot the full page or just the feed section

**What it proves**: 
- ✅ App actually works
- ✅ UI is polished
- ✅ Has real data

**Annotate** (optional):
- Circle a "New" badge → "Fresh opportunities"
- Circle AI tags → "Auto-tagged by Bedrock"
- Circle filter buttons → "One-click filtering"

---

### 2. AWS Bedrock Console (MUST HAVE)
**What to show**: Proof of Bedrock usage

**How to capture**:
1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/usage)
2. Click "Model invocations" or "Usage"
3. You should see Claude 3 Haiku invocations
4. Screenshot showing:
   - Model name: `anthropic.claude-3-haiku-20240307-v1:0`
   - Number of invocations
   - Date range

**What it proves**:
- ✅ Actually using AWS service
- ✅ Not just code, but production usage
- ✅ Bedrock is working

**Annotate**:
- Circle the invocation count → "200+ opportunities classified"
- Add text: "Every opportunity runs through Bedrock AI"

---

### 3. Opportunity Card Close-Up (Nice to Have)
**What to show**: Single opportunity with all details

**How to capture**:
1. On feed page, screenshot one card that shows:
   - Title and company
   - AI-generated tags
   - Location, stipend, deadline
   - "New" badge
   - "View posting" link

**What it proves**:
- ✅ Feature-rich cards
- ✅ AI tagging visible
- ✅ Professional design

**Annotate**:
- Point to tags → "AI-detected by Bedrock"
- Point to deadline → "Auto-extracted"

---

### 4. Filter/Search in Action (Nice to Have)
**What to show**: Using filters or search

**How to capture**:
1. Click "Internships" filter
2. Screenshot showing filtered results
3. Shows count: "47 opportunities"

**What it proves**:
- ✅ Functional filtering
- ✅ Makes life easier
- ✅ Solves the "too much noise" problem

---

### 5. Application Tracker (Bonus)
**What to show**: Tracker page with applications

**How to capture**:
1. Open `/tracker` page
2. Add 2-3 sample applications if empty
3. Screenshot showing pipeline stages

**What it proves**:
- ✅ Complete solution (not just scraping)
- ✅ End-to-end workflow
- ✅ Production-ready

---

## 🎨 Screenshot Best Practices

### Quality
- Use browser zoom at 100% (not zoomed in/out)
- Full width browser window (not narrow)
- Hide personal bookmarks bar if messy
- Use light mode (screenshots look better)

### Tools
- **Windows**: Win + Shift + S
- **Mac**: Cmd + Shift + 4
- **Browser Extension**: Awesome Screenshot (can capture full page)

### Editing (Optional)
- Use [Excalidraw](https://excalidraw.com) to add arrows/circles
- Or Windows Paint / Mac Preview
- Keep it simple: just circle key features

---

## 📝 Where to Use Screenshots in Article

### In "Vision & What the App Does" section:
- Screenshot #1: Feed Dashboard
- Caption: *"OpGrid feed showing auto-tagged opportunities from multiple sources"*

### In "AWS Services Used" section:
- Screenshot #2: AWS Bedrock Console
- Caption: *"Amazon Bedrock usage showing 200+ opportunity classifications"*

### In "Impact & Results" section:
- Screenshot #3: Opportunity Card
- Caption: *"AI-powered tags and auto-extracted metadata on each opportunity"*

### Optional (Bottom of article):
- Screenshot #4: Filters
- Screenshot #5: Tracker

---

## 🚨 What NOT to Screenshot

❌ Don't show:
- Empty states ("No opportunities found")
- Error messages
- Loading spinners
- Your personal email/API keys
- Database admin panel
- Code editor (save for GitHub)

✅ Do show:
- Working features with real data
- AWS console with usage metrics
- Polished UI with multiple items
- Features that solve the problem

---

## 📐 Example Layout for Article

```markdown
## 🎯 Vision & What the App Does

[Paragraph about problem]

![OpGrid Feed Dashboard](screenshots/feed-dashboard.png)
*OpGrid's main dashboard showing opportunities automatically scraped and AI-tagged*

[Rest of section]

## 🏗️ AWS Services Used

[Architecture explanation]

![AWS Bedrock Usage](screenshots/bedrock-console.png)
*Amazon Bedrock invocations showing Claude 3 Haiku classifying 200+ opportunities*

[Rest of section]
```

---

## 🎯 Quick Checklist

Before submitting article:

- [ ] Screenshot #1: Feed with 10+ opportunities ✅
- [ ] Screenshot #2: AWS Bedrock console showing usage ✅
- [ ] Screenshot #3: Close-up of one opportunity card (optional)
- [ ] All screenshots are clear and readable
- [ ] No personal info visible (emails, API keys, etc.)
- [ ] Uploaded to article draft
- [ ] Captions added under each image

---

## 💡 Pro Tips

1. **Take more than you need**: Capture 5-6 screenshots, use the best 2-3
2. **Show diversity**: Different companies, tags, sources in feed
3. **Highlight "NEW"**: If possible, show "New" badges (proves it's actively scraping)
4. **AWS proof is crucial**: The Bedrock console screenshot is your eligibility proof
5. **Mobile screenshot bonus**: If app works on mobile, screenshot that too!

---

## 🚀 After Screenshots

1. Upload to AWS Builder Center article draft
2. Add descriptive captions (not just "Screenshot 1")
3. Reference them in text: "As shown in the dashboard above..."
4. Make sure they're visible (not too small)

**With good screenshots, your article will be in the top 20%!** 📸

---

## Example Captions

Good captions are specific:

✅ **Good**: "OpGrid feed showing 47 internship opportunities auto-tagged by Amazon Bedrock, with filters for remote, paid, and beginner-friendly positions"

❌ **Bad**: "The feed page"

✅ **Good**: "AWS Bedrock console showing 237 Claude 3 Haiku invocations over 3 weeks, with each invocation classifying one opportunity"

❌ **Bad**: "AWS screenshot"

Make them tell a story!
