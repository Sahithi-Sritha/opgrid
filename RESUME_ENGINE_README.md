# 📄 OpGrid Resume Intelligence Engine

Complete LaTeX-powered resume analysis and optimization pipeline.

## 🎯 Features

### Part A: Resume Upload & Parse
- ✅ Upload `.tex` (LaTeX) or `.pdf` files
- ✅ PDF → LaTeX conversion using Claude AI
- ✅ Automatic PDF compilation
- ✅ Version tracking with Supabase storage

### Part B: JD Keyword Extraction
- ✅ AI-powered keyword extraction from job descriptions
- ✅ Categorized keywords (hard skills, soft skills, tools, certifications, action verbs)
- ✅ Match score calculation (0-100)
- ✅ Missing vs present keyword analysis

### Part C: Intelligent Edit Suggestions
- ✅ Claude-powered edit suggestions
- ✅ Natural keyword incorporation
- ✅ Action verb strengthening
- ✅ Metrics addition
- ✅ Context-aware enhancements

### Part D: Resume Regeneration
- ✅ Apply selected edits
- ✅ LaTeX → PDF compilation
- ✅ Version control (base_version_id tracking)
- ✅ Diff statistics

### Part E: "I Applied" Voice Command
- ✅ Auto-detect application submission
- ✅ Create application tracking records
- ✅ Link resume versions
- ✅ Smart intent detection

## 🗄️ Database Schema

### `resume_versions`
```sql
- id (uuid)
- filename (text)
- label (text)
- latex_source (text)
- pdf_url (text)
- base_version_id (uuid, FK → self)
- created_at (timestamptz)
```

### `jd_analyses`
```sql
- id (uuid)
- jd_text (text)
- jd_source_url (text)
- jd_keywords (jsonb)
- resume_version_id (uuid, FK)
- match_score (int 0-100)
- missing_keywords (text[])
- present_keywords (text[])
- suggested_edits (jsonb)
- ai_rewrite_applied (boolean)
- created_at (timestamptz)
```

## 🚀 Setup

### 1. Install LaTeX Compiler

#### Ubuntu/Debian
```bash
apt-get install texlive-latex-base texlive-latex-extra
```

#### macOS
```bash
brew install --cask mactex
```

#### Or use Tectonic (modern alternative)
```bash
curl -fsSL https://drop.axo.dev/installer.sh | sh
```

### 2. Install Dependencies
```bash
cd agent
npm install
```

### 3. Run Database Migration
Execute `schema-migration-resume-engine.sql` in Supabase SQL Editor.

### 4. Create Storage Bucket
In Supabase dashboard:
- Go to Storage
- Create bucket named `resumes`
- Set to private (auth required)

### 5. Start Agent
```bash
npm run dev
```

## 📡 API Endpoints

### Resume Upload
```bash
POST /api/resume/upload
Content-Type: multipart/form-data

# Body:
file: resume.pdf or resume.tex
label: "My Resume v1"
```

### JD Analysis
```bash
POST /api/jd/analyze
Content-Type: application/json

{
  "jd_text": "Job description text...",
  "resume_version_id": "uuid",
  "jd_source_url": "https://company.com/job"
}
```

### Generate Edit Suggestions
```bash
POST /api/resume/suggest-edits
Content-Type: application/json

{
  "jd_analysis_id": "uuid"
}
```

### Apply Edits & Regenerate
```bash
POST /api/resume/apply-edits
Content-Type: application/json

{
  "resume_version_id": "uuid",
  "accepted_edits": [
    {
      "current_line": "Built a pipeline...",
      "suggested_line": "Architected a production pipeline..."
    }
  ],
  "new_label": "Resume v2 - SWE Intern"
}
```

### Apply Intent Detection
```bash
POST /api/apply/detect
Content-Type: application/json

{
  "message": "I applied",
  "context": {
    "opportunity_id": "uuid",
    "jd_analysis_id": "uuid"
  }
}
```

## 🎨 Frontend Integration

### Upload Resume
```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('label', 'My Resume')

const response = await fetch('/api/resume/upload', {
  method: 'POST',
  body: formData
})
```

### Analyze JD
```typescript
const response = await fetch('/api/jd/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jd_text: jobDescription,
    resume_version_id: resumeId
  })
})

const { match_score, missing_keywords } = await response.json()
```

### Get Suggestions
```typescript
const response = await fetch('/api/resume/suggest-edits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jd_analysis_id: analysisId
  })
})

const { suggestions } = await response.json()
```

## 🧪 Testing

### Test Resume Upload
```bash
curl -X POST http://localhost:3001/api/resume/upload \
  -F "file=@resume.pdf" \
  -F "label=Test Resume"
```

### Test JD Analysis
```bash
curl -X POST http://localhost:3001/api/jd/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "jd_text": "We are looking for a software engineer...",
    "resume_version_id": "your-uuid"
  }'
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t opgrid-agent .

# Run container
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your-key \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_KEY=your-key \
  opgrid-agent
```

## 🔧 LaTeX Compilation

The agent supports two LaTeX compilers:

1. **Tectonic** (preferred)
   - Modern, fast
   - Auto-downloads packages
   - Better error handling

2. **pdflatex** (fallback)
   - Traditional compiler
   - Requires full texlive installation

## 📊 Workflow Example

1. **Upload Resume**
   ```
   User uploads resume.pdf
   → PDF text extracted
   → Claude converts to LaTeX
   → LaTeX compiled to PDF
   → Stored in Supabase
   ```

2. **Analyze JD**
   ```
   User pastes job description
   → Claude extracts keywords
   → Resume compared to keywords
   → Match score: 72%
   → Missing: ["Kubernetes", "CI/CD"]
   ```

3. **Get Suggestions**
   ```
   User requests suggestions
   → Claude analyzes resume
   → Suggests 5 edits
   → User reviews and accepts 3
   ```

4. **Regenerate Resume**
   ```
   Agent applies 3 edits
   → Claude updates LaTeX
   → Compiled to PDF
   → New version created
   → PDF URL returned
   ```

5. **Apply Intent**
   ```
   User types "I applied"
   → Intent detected (confidence: 0.95)
   → Application record created
   → Resume version linked
   → Toast notification shown
   ```

## 🎯 Match Score Algorithm

```
match_score = (present_keywords / total_keywords) * 100

where:
- present_keywords = keywords found in resume
- total_keywords = all keywords from JD
```

## 🏷️ Keyword Categories

- **hard_skills**: Python, React, Machine Learning
- **soft_skills**: Leadership, Communication, Teamwork
- **tools**: Docker, Kubernetes, AWS
- **certifications**: AWS Certified, PMP
- **action_verbs**: Architected, Designed, Optimized

## 🔒 Security

- Resume PDFs stored in private Supabase bucket
- LaTeX source stored in database (encrypted at rest)
- Temp files cleaned up after compilation
- File uploads validated (tex/pdf only)
- Max file size: 10MB

## 📈 Performance

- PDF → LaTeX conversion: ~5-10s
- LaTeX compilation: ~3-5s
- JD analysis: ~2-3s
- Edit generation: ~5-8s

## 🐛 Troubleshooting

### LaTeX compilation fails
```bash
# Check compiler availability
pdflatex --version
tectonic --version

# Test manual compilation
pdflatex test.tex
```

### PDF upload fails
- Check file size < 10MB
- Verify PDF is not encrypted
- Ensure pdf-parse is installed

### Missing keywords
- Keyword matching is case-insensitive
- Partial matches not counted
- Add synonyms manually if needed

## 🚀 Future Enhancements

- [ ] Parallel LaTeX compilation
- [ ] Resume templates library
- [ ] ATS score prediction
- [ ] Multi-language support
- [ ] Resume diff visualization
- [ ] Bulk JD analysis
- [ ] A/B testing resume versions

## 📚 Resources

- [LaTeX Documentation](https://www.latex-project.org/help/documentation/)
- [Tectonic Guide](https://tectonic-typesetting.github.io/)
- [Claude API Docs](https://docs.anthropic.com/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Resume intelligence engine is live!** 🎯

Track versions, optimize for JD matches, and automatically regenerate PDFs.
