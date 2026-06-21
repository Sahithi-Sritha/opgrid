import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface JDKeywords {
  hard_skills: string[]
  soft_skills: string[]
  tools: string[]
  certifications: string[]
  action_verbs: string[]
  years_experience: string | null
  role_level: 'intern' | 'entry' | 'mid' | 'senior' | 'other'
  domain: 'frontend' | 'backend' | 'fullstack' | 'ml' | 'devops' | 'product' | 'other'
}

export async function extractJDKeywords(jdText: string): Promise<JDKeywords> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are an ATS and recruiter keyword analyst. Extract all important keywords from this job description and return ONLY a JSON object, no markdown code blocks.

Schema:
{
  "hard_skills": ["Python", "React", ...],
  "soft_skills": ["communication", "leadership", ...],
  "tools": ["Kubernetes", "Figma", ...],
  "certifications": ["AWS Certified", ...],
  "action_verbs": ["designed", "architected", ...],
  "years_experience": "2+ years" or null,
  "role_level": "intern" | "entry" | "mid" | "senior" | "other",
  "domain": "frontend" | "backend" | "fullstack" | "ml" | "devops" | "product" | "other"
}

Job Description:
${jdText}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

export async function compareResumeToJD(
  resumeLatex: string, 
  keywords: JDKeywords
): Promise<{
  match_score: number
  present_keywords: string[]
  missing_keywords: string[]
  missing_by_category: any
}> {
  // Flatten all keywords
  const allKeywords = [
    ...keywords.hard_skills,
    ...keywords.soft_skills,
    ...keywords.tools,
    ...keywords.certifications,
    ...keywords.action_verbs
  ]

  // Simple text matching (case insensitive)
  const resumeLower = resumeLatex.toLowerCase()
  const present: string[] = []
  const missing: string[] = []

  allKeywords.forEach(keyword => {
    if (resumeLower.includes(keyword.toLowerCase())) {
      present.push(keyword)
    } else {
      missing.push(keyword)
    }
  })

  // Calculate match score
  const matchScore = allKeywords.length > 0 
    ? Math.round((present.length / allKeywords.length) * 100)
    : 0

  // Categorize missing keywords
  const missingByCategory = {
    hard_skills: keywords.hard_skills.filter(k => !resumeLower.includes(k.toLowerCase())),
    soft_skills: keywords.soft_skills.filter(k => !resumeLower.includes(k.toLowerCase())),
    tools: keywords.tools.filter(k => !resumeLower.includes(k.toLowerCase())),
    certifications: keywords.certifications.filter(k => !resumeLower.includes(k.toLowerCase())),
    action_verbs: keywords.action_verbs.filter(k => !resumeLower.includes(k.toLowerCase()))
  }

  return {
    match_score: matchScore,
    present_keywords: present,
    missing_keywords: missing,
    missing_by_category: missingByCategory
  }
}
