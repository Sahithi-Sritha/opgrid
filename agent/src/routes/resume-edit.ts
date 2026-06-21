import { Router } from 'express'
import { supabase } from '../config/supabase'
import { generateEditSuggestions } from '../services/resume-editor'

const router = Router()

// POST /api/resume/suggest-edits
// Generate intelligent edit suggestions based on JD analysis
router.post('/suggest-edits', async (req, res) => {
  try {
    const { jd_analysis_id } = req.body

    if (!jd_analysis_id) {
      return res.status(400).json({ error: 'Missing jd_analysis_id' })
    }

    // Fetch JD analysis with resume
    const { data: analysis, error: analysisError } = await supabase
      .from('jd_analyses')
      .select(`
        *,
        resume_versions (
          id,
          latex_source
        )
      `)
      .eq('id', jd_analysis_id)
      .single()

    if (analysisError || !analysis) {
      return res.status(404).json({ error: 'JD analysis not found' })
    }

    const resume = (analysis as any).resume_versions
    
    console.log('→ Generating edit suggestions with Claude...')
    const suggestions = await generateEditSuggestions(
      resume.latex_source,
      analysis.missing_keywords,
      analysis.jd_text
    )

    // Save suggestions to the analysis
    const { error: updateError } = await supabase
      .from('jd_analyses')
      .update({
        suggested_edits: suggestions
      })
      .eq('id', jd_analysis_id)

    if (updateError) {
      console.error('Failed to save suggestions:', updateError)
    }

    res.json({
      suggestions,
      count: suggestions.length,
      message: `Generated ${suggestions.length} edit suggestions`
    })

  } catch (error) {
    console.error('Edit suggestion error:', error)
    res.status(500).json({
      error: 'Failed to generate edit suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/resume/suggestions/:jd_analysis_id
router.get('/suggestions/:jd_analysis_id', async (req, res) => {
  try {
    const { jd_analysis_id } = req.params

    const { data: analysis, error } = await supabase
      .from('jd_analyses')
      .select('suggested_edits, missing_keywords')
      .eq('id', jd_analysis_id)
      .single()

    if (error || !analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    res.json({
      suggestions: analysis.suggested_edits || [],
      missing_keywords: analysis.missing_keywords
    })

  } catch (error) {
    console.error('Suggestions fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch suggestions' })
  }
})

export default router
