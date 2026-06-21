# 🚀 Resume Engine - Quick Start

Get the LaTeX resume intelligence pipeline running in 10 minutes!

## ⚡ Setup

### 1. Install LaTeX (2 min)

**Choose ONE:**

#### Option A: Tectonic (Recommended - Small & Fast)
```bash
curl -fsSL https://drop.axo.dev/installer.sh | sh
mv ~/.cargo/bin/tectonic /usr/local/bin/
```

#### Option B: Full TeX Live
```bash
# Ubuntu/Debian
sudo apt-get install texlive-latex-base texlive-latex-extra

# macOS
brew install --cask mactex
```

Verify:
```bash
tectonic --version
# OR
pdflatex --version
```

### 2. Install Dependencies (1 min)
```bash
cd agent
npm install
```

### 3. Run Database Migration (2 min)

Copy and run in Supabase SQL Editor:
```sql
-- See schema-migration-resume-engine.sql

CREATE TABLE resume_versions (...);
CREATE TABLE jd_analyses (...);
ALTER TABLE applications ADD COLUMN resume_version_id UUID;
```

### 4. Create Storage Bucket (1 min)

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New bucket**
3. Name: `resumes`
4. Public: **OFF** (private)
5. Click **Create**

✅ Done!

### 5. Start Agent (30 sec)
```bash
npm run dev
```

You should see:
```
🚀 OpGrid Agent running on port 3001
✅ Cron jobs scheduled
✅ Resume routes loaded
```

## 🎯 Quick Test

### Test 1: Upload Resume

```bash
curl -X POST http://localhost:3001/api/resume/upload \
  -F "file=@your_resume.pdf" \
  -F "label=My Resume v1"
```

Expected response:
```json
{
  "id": "uuid",
  "label": "My Resume v1",
  "has_latex": false,
  "pdf_url": "https://...",
  "message": "PDF converted to LaTeX and compiled successfully"
}
```

### Test 2: Analyze JD

```bash
curl -X POST http://localhost:3001/api/jd/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "jd_text": "We need a software engineer with Python, React, and AWS experience...",
    "resume_version_id": "uuid-from-upload"
  }'
```

Expected response:
```json
{
  "analysis_id": "uuid",
  "match_score": 72,
  "missing_keywords": ["Kubernetes", "CI/CD"],
  "present_keywords": ["Python", "React", "AWS"]
}
```

### Test 3: Get Edit Suggestions

```bash
curl -X POST http://localhost:3001/api/resume/suggest-edits \
  -H "Content-Type: application/json" \
  -d '{
    "jd_analysis_id": "uuid-from-analysis"
  }'
```

Expected response:
```json
{
  "suggestions": [
    {
      "section": "Experience — Company",
      "current_line": "Built a pipeline...",
      "suggested_line": "Architected a production pipeline with Kubernetes...",
      "keywords_added": ["Architected", "Kubernetes"],
      "confidence": 0.9
    }
  ],
  "count": 5
}
```

## 📱 Frontend Integration

### Upload Resume Component

```typescript
// frontend/components/ResumeUpload.tsx
'use client'

import { useState } from 'react'

export function ResumeUpload() {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File, label: string) => {
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('label', label)

    const response = await fetch('/api/resume/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    setUploading(false)
    
    return data
  }

  return (
    <div>
      {/* File input and upload UI */}
    </div>
  )
}
```

### JD Analyzer Component

```typescript
// frontend/components/JDAnalyzer.tsx
'use client'

import { useState } from 'react'

export function JDAnalyzer({ resumeId }: { resumeId: string }) {
  const [jdText, setJdText] = useState('')
  const [result, setResult] = useState(null)

  const analyzeJD = async () => {
    const response = await fetch('/api/jd/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jd_text: jdText,
        resume_version_id: resumeId
      })
    })

    const data = await response.json()
    setResult(data)
  }

  return (
    <div>
      <textarea 
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder="Paste job description here..."
      />
      <button onClick={analyzeJD}>Analyze Match</button>
      
      {result && (
        <div>
          <h3>Match Score: {result.match_score}%</h3>
          <p>Missing: {result.missing_keywords.join(', ')}</p>
        </div>
      )}
    </div>
  )
}
```

## 🎨 Full Workflow Example

### Scenario: Optimizing Resume for Google SWE Intern

```bash
# 1. Upload your resume
RESUME_ID=$(curl -X POST http://localhost:3001/api/resume/upload \
  -F "file=@resume.pdf" \
  -F "label=Base Resume" \
  | jq -r '.id')

# 2. Analyze against Google JD
ANALYSIS_ID=$(curl -X POST http://localhost:3001/api/jd/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "jd_text": "Google is seeking a Software Engineering Intern...",
    "resume_version_id": "'$RESUME_ID'"
  }' | jq -r '.analysis_id')

# 3. Get suggestions
curl -X POST http://localhost:3001/api/resume/suggest-edits \
  -H "Content-Type: application/json" \
  -d '{
    "jd_analysis_id": "'$ANALYSIS_ID'"
  }' | jq '.suggestions'

# 4. Apply edits
curl -X POST http://localhost:3001/api/resume/apply-edits \
  -H "Content-Type: application/json" \
  -d '{
    "resume_version_id": "'$RESUME_ID'",
    "accepted_edits": [...],
    "new_label": "Resume - Google SWE Intern"
  }' | jq '.pdf_url'

# 5. Download new PDF from the returned URL
```

## 📊 Database Queries

### View All Resumes
```sql
SELECT id, label, filename, created_at, pdf_url
FROM resume_versions
ORDER BY created_at DESC;
```

### View JD Analyses
```sql
SELECT 
  ja.id,
  ja.match_score,
  ja.missing_keywords,
  rv.label as resume_name,
  ja.created_at
FROM jd_analyses ja
JOIN resume_versions rv ON ja.resume_version_id = rv.id
ORDER BY ja.created_at DESC;
```

### View Resume Versions Tree
```sql
SELECT 
  id,
  label,
  base_version_id,
  created_at
FROM resume_versions
WHERE base_version_id IS NULL  -- Root versions
ORDER BY created_at DESC;
```

## 🔧 Troubleshooting

### "tectonic: command not found"
```bash
# Install tectonic
curl -fsSL https://drop.axo.dev/installer.sh | sh
mv ~/.cargo/bin/tectonic /usr/local/bin/

# OR install pdflatex
sudo apt-get install texlive-latex-base
```

### "Storage bucket not found"
```bash
# Create in Supabase dashboard or via SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false);
```

### "PDF compilation failed"
```bash
# Check LaTeX logs in /tmp/
ls -la /tmp/*.log

# Test manual compilation
echo '\documentclass{article}\begin{document}Hello\end{document}' > test.tex
pdflatex test.tex
```

### "Anthropic API error"
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Or in .env file
cat agent/.env | grep ANTHROPIC
```

## ✅ Verification Checklist

- [ ] LaTeX compiler installed (tectonic or pdflatex)
- [ ] Database migration ran successfully
- [ ] Storage bucket created
- [ ] Agent starts without errors
- [ ] Can upload PDF resume
- [ ] Can analyze JD
- [ ] Can generate suggestions
- [ ] Can apply edits and regenerate

## 🎯 Next Steps

1. **Integrate with Frontend**: Update resume page to use new APIs
2. **Add UI**: Build resume upload, JD analysis, and edit review interfaces
3. **Test Workflow**: Try full resume optimization flow
4. **Deploy**: Use Docker image with LaTeX baked in

## 📚 Full Documentation

- **RESUME_ENGINE_README.md** - Complete documentation
- **schema-migration-resume-engine.sql** - Database schema
- **agent/Dockerfile** - Production deployment

---

**Resume intelligence is live!** 🎯

Upload → Analyze → Optimize → Regenerate → Apply

**Total setup time: ~10 minutes**
