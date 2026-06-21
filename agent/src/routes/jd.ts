import { Router } from 'express'
import { supabase } from '../config/supabase'
import { extractJDKeywords, compareResumeToJD } from '../services/jd-analyzer'

const router = Router()

// POST /api/jd/analyze
// Extract keywords from JD and compare with resume
router.post('/analyze', async (req, res) => {
  try {
    const { jd_text, resume_version_id, jd_source_url } = req.body

    if (!jd_text || !resume_version_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: jd_text, resume_version_id' 
      })
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resume_versions')
      .select('latex_source')
      .eq('id', resume_version_id)
      .single()

    if (resumeError || !resume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    console.log('→ Extracting keywords from JD...')
    const keywords = await extractJDKeywords(jd_text)

    console.log('→ Comparing resume to JD...')
    const comparison = await compareResumeToJD(resume.latex_source, keywords)

    // Save analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('jd_analyses')
      .insert({
        jd_text,
        jd_source_url: jd_source_url || null,
        jd_keywords: keywords,
        resume_version_id,
        match_score: comparison.match_score,
        missing_keywords: comparison.missing_keywords,
        present_keywords: comparison.present_keywords
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Analysis save error:', analysisError)
      return res.status(500).json({ error: 'Failed to save analysis' })
    }

    res.json({
      analysis_id: analysis.id,
      match_score: comparison.match_score,
      present_keywords: comparison.present_keywords,
      missing_keywords: comparison.missing_keywords,
      missing_by_category: comparison.missing_by_category,
      keywords
    })

  } catch (error) {
    console.error('JD analysis error:', error)
    res.status(500).json({ 
      error: 'Failed to analyze JD',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/jd/analysis/:id
router.get('/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: analysis, error } = await supabase
      .from('jd_analyses')
      .select(`
        *,
        resume_versions (
          id,
          label,
          filename
        )
      `)
      .eq('id', id)
      .single()

    if (error || !analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    res.json({ analysis })
  } catch (error) {
    console.error('Analysis fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch analysis' })
  }
})

export default router
