import { Router } from 'express'
import { supabase } from '../config/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// POST /api/apply/detect
// Detect if user message indicates they applied to a job
router.post('/detect', async (req, res) => {
  try {
    const { message, context } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Missing message' })
    }

    console.log('→ Detecting apply intent...')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Detect if this message indicates the user just applied to a job/hackathon/opportunity.

Return ONLY JSON, no markdown code blocks:
{
  "is_apply_intent": boolean,
  "confidence": float (0-1)
}

Examples of apply intent:
- "I applied"
- "Just submitted my application"
- "Applied to this one"
- "Done, applied!"
- "Submitted"
- "Applied just now"

Not apply intent:
- "Should I apply?"
- "Thinking about applying"
- "I want to apply"
- "How do I apply?"

User message: "${message}"`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const intent = JSON.parse(cleaned)

    if (!intent.is_apply_intent || intent.confidence < 0.7) {
      return res.json({ 
        tracked: false,
        intent
      })
    }

    // Auto-track application
    const { opportunity_id, jd_analysis_id } = context || {}

    if (!opportunity_id) {
      return res.json({
        tracked: false,
        intent,
        message: 'No opportunity context provided'
      })
    }

    // Get most recently used resume version
    let resume_version_id = null
    if (jd_analysis_id) {
      const { data: analysis } = await supabase
        .from('jd_analyses')
        .select('resume_version_id')
        .eq('id', jd_analysis_id)
        .single()
      
      resume_version_id = analysis?.resume_version_id
    }

    if (!resume_version_id) {
      // Get latest resume
      const { data: latestResume } = await supabase
        .from('resume_versions')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      resume_version_id = latestResume?.id
    }

    // Create application record
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        opportunity_id,
        applied_date: new Date().toISOString().split('T')[0],
        status: 'applied',
        resume_version_id,
        notes: `Auto-tracked from message: "${message}"`
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create application:', error)
      return res.json({
        tracked: false,
        error: 'Failed to track application'
      })
    }

    res.json({
      tracked: true,
      application_id: application.id,
      intent,
      message: 'Got it! Tracked as applied. Which resume version did you use?'
    })

  } catch (error) {
    console.error('Apply intent detection error:', error)
    res.status(500).json({
      error: 'Failed to detect apply intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
