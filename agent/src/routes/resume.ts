import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../config/supabase'
import { extractPDFText, pdfToLatex } from '../services/resume-parser'
import { compileLatexToPDF, uploadPDFToStorage } from '../services/latex-compiler'
import fs from 'fs'
import path from 'path'

const router = Router()
const upload = multer({ dest: '/tmp/uploads/' })

// POST /api/resume/upload
// Accept .tex or .pdf file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { label } = req.body
    const file = req.file
    const filename = file.originalname
    const ext = path.extname(filename).toLowerCase()

    let latexSource = ''
    let hasLatex = true

    if (ext === '.tex') {
      // Read LaTeX directly
      latexSource = fs.readFileSync(file.path, 'utf-8')
      console.log('✓ LaTeX file uploaded directly')
    } else if (ext === '.pdf') {
      // Extract text and convert to LaTeX
      console.log('→ Extracting text from PDF...')
      const extractedText = await extractPDFText(file.path)
      
      console.log('→ Converting to LaTeX with Claude...')
      latexSource = await pdfToLatex(extractedText)
      hasLatex = false // Reconstructed, not original
    } else {
      return res.status(400).json({ error: 'Only .tex and .pdf files are supported' })
    }

    // Compile LaTeX to PDF
    console.log('→ Compiling LaTeX to PDF...')
    const pdfBuffer = await compileLatexToPDF(latexSource)

    // Upload PDF to Supabase storage
    console.log('→ Uploading PDF to storage...')
    const pdfUrl = await uploadPDFToStorage(pdfBuffer, `${Date.now()}_${filename.replace(ext, '.pdf')}`)

    // Insert to database
    const { data: resumeVersion, error } = await supabase
      .from('resume_versions')
      .insert({
        filename,
        label: label || `Resume ${Date.now()}`,
        latex_source: latexSource,
        pdf_url: pdfUrl
      })
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      return res.status(500).json({ error: 'Failed to save resume' })
    }

    // Clean up temp file
    fs.unlinkSync(file.path)

    res.json({
      id: resumeVersion.id,
      label: resumeVersion.label,
      has_latex: hasLatex,
      pdf_url: pdfUrl,
      message: hasLatex 
        ? 'LaTeX resume uploaded successfully' 
        : 'PDF converted to LaTeX and compiled successfully'
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    res.status(500).json({ 
      error: 'Failed to process resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/resume/list
router.get('/list', async (req, res) => {
  try {
    const { data: resumes, error } = await supabase
      .from('resume_versions')
      .select('id, filename, label, pdf_url, base_version_id, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      // The resume engine is optional; keep opportunity details usable before its migration runs.
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return res.json({ resumes: [] })
      }
      throw error
    }

    res.json({ resumes: resumes || [] })
  } catch (error) {
    console.error('Resume list error:', error)
    res.status(500).json({ error: 'Failed to fetch resumes' })
  }
})

// GET /api/resume/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: resume, error } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !resume) {
      return res.status(404).json({ error: 'Resume not found' })
    }

    res.json({ resume })
  } catch (error) {
    console.error('Resume fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch resume' })
  }
})

export default router
