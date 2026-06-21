import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface EditSuggestion {
  section: string
  current_line: string
  suggested_line: string
  keywords_added: string[]
  edit_type: 'enhance' | 'add_metric' | 'rephrase' | 'new_bullet'
  confidence: number
  reason: string
}

export async function generateEditSuggestions(
  latexSource: string,
  missingKeywords: string[],
  jdContext: string
): Promise<EditSuggestion[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a senior technical recruiter and resume writer. Given a LaTeX resume and a list of missing keywords from a job description, suggest SPECIFIC edits to the resume that naturally incorporate the missing keywords.

Do NOT fabricate experience. Instead:
1. Find existing bullet points that can be enhanced with more precise terminology
2. Suggest stronger action verbs
3. Identify where metrics can be added
4. Point out where a missing tool/skill could be honestly added based on context

Return ONLY a JSON array of edit suggestions, no markdown code blocks:
[
  {
    "section": "Experience — Company Name",
    "current_line": "Built a RAG pipeline for health data queries",
    "suggested_line": "Architected a production RAG pipeline with LangChain for health data queries, reducing response latency by 40%",
    "keywords_added": ["architected", "production", "LangChain", "latency"],
    "edit_type": "enhance",
    "confidence": 0.9,
    "reason": "Adds 'architected' (missing action verb) and 'production' (missing qualifier)"
  }
]

LaTeX Resume:
${latexSource.slice(0, 4000)}

Missing keywords: ${JSON.stringify(missingKeywords)}

Job Description context: ${jdContext.slice(0, 500)}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

export async function applyEditsToLatex(
  originalLatex: string,
  edits: Array<{ current_line: string; suggested_line: string }>
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a LaTeX expert. Apply these specific text replacements to the LaTeX source and return the complete updated .tex file. 

Make ONLY the specified changes. Preserve all formatting, commands, and structure exactly.

Output ONLY the complete LaTeX source, no explanation, no markdown code blocks.

Original LaTeX:
${originalLatex}

Replacements to apply:
${JSON.stringify(edits, null, 2)}`

  const result = await model.generateContent(prompt)
  let latex = result.response.text().trim()
  latex = latex.replace(/```latex\n?/g, '').replace(/```\n?/g, '')
  return latex
}
