import { Router } from 'express'
import { supabase } from '../config/supabase'
import { applyEditsToLatex } from '../services/resume-editor'
import { compileLatexToPDF, uploadPDFToStorage } from '../services/latex-compiler'

const router = Router()

router.use((_req, res) => {
  res.status(501).json({ error: 'PDF compilation is disabled until a sandboxed LaTeX compiler is configured. Saving and versioning LaTeX remains available.' })
})

// POST /api/resume/apply-edits
// Apply selected edits and regenerate PDF
router.post('/apply-edits', async (req, res) => {
  try {
    const { resume_version_id, accepted_edits, new_label } = req.body

    if (!resume_version_id || !accepted_edits || !new_label) {
      return res.status(400).json({
        error: 'Missing required fields: resume_version_id, accepted_edits, new_label'
      })
    }

    // Fetch original resume
    const { data: originalResume, error: fetchError } = await supabase
      .from('resume_versions')
      .select('latex_source, filename')
      .eq('id', resume_version_id)
      .single()

    if (fetchError || !originalResume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    console.log(`→ Applying ${accepted_edits.length} edits...`)

    // Apply edits using Claude
    const updatedLatex = await applyEditsToLatex(
      originalResume.latex_source,
      accepted_edits
    )

    console.log('→ Compiling updated LaTeX to PDF...')
    const pdfBuffer = await compileLatexToPDF(updatedLatex)

    console.log('→ Uploading new PDF to storage...')
    const pdfUrl = await uploadPDFToStorage(
      pdfBuffer, 
      `${Date.now()}_${new_label.replace(/\s+/g, '_')}.pdf`
    )

    // Insert new version
    const { data: newVersion, error: insertError } = await supabase
      .from('resume_versions')
      .insert({
        filename: `${new_label}.pdf`,
        label: new_label,
        latex_source: updatedLatex,
        pdf_url: pdfUrl,
        base_version_id: resume_version_id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return res.status(500).json({ error: 'Failed to save new version' })
    }

    // Calculate diff stats
    const originalLength = originalResume.latex_source.length
    const newLength = updatedLatex.length
    const linesChanged = accepted_edits.length
    const keywordsAdded = accepted_edits.reduce((acc: number, edit: any) => 
      acc + (edit.keywords_added?.length || 0), 0
    )

    res.json({
      new_version_id: newVersion.id,
      pdf_url: pdfUrl,
      diff_stats: {
        lines_changed: linesChanged,
        keywords_added: keywordsAdded,
        size_change: newLength - originalLength
      },
      message: 'Resume updated and compiled successfully'
    })

  } catch (error) {
    console.error('Resume compilation error:', error)
    res.status(500).json({
      error: 'Failed to apply edits and compile',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/resume/recompile/:id
// Recompile existing LaTeX source to PDF
router.post('/recompile/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: resume, error } = await supabase
      .from('resume_versions')
      .select('latex_source, label')
      .eq('id', id)
      .single()

    if (error || !resume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    console.log('→ Recompiling LaTeX...')
    const pdfBuffer = await compileLatexToPDF(resume.latex_source)

    console.log('→ Uploading PDF...')
    const pdfUrl = await uploadPDFToStorage(
      pdfBuffer,
      `${Date.now()}_${resume.label.replace(/\s+/g, '_')}.pdf`
    )

    // Update PDF URL
    const { error: updateError } = await supabase
      .from('resume_versions')
      .update({ pdf_url: pdfUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Update error:', updateError)
      return res.status(500).json({ error: 'Failed to update PDF URL' })
    }

    res.json({
      pdf_url: pdfUrl,
      message: 'Resume recompiled successfully'
    })

  } catch (error) {
    console.error('Recompile error:', error)
    res.status(500).json({
      error: 'Failed to recompile',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
