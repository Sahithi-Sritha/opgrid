import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../config/supabase'
import { extractPDFText, pdfToLatex } from '../services/resume-parser'
import { compileLatexToPDF, uploadPDFToStorage } from '../services/latex-compiler'
import fs from 'fs'
import path from 'path'

const router = Router()
const upload = multer({ dest: '/tmp/uploads/' })
const evaluationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
})

// POST /api/resume/evaluate
// Forwards a PDF only to a separately deployed, private HackerAgentRank service.
// The file is held in memory for this request and is never written by OpGrid.
router.post('/evaluate', evaluationUpload.single('file'), async (req, res) => {
  const endpoint = process.env.HACKER_AGENT_RANK_URL
  const file = req.file
  if (!endpoint) return res.status(503).json({ error: 'Resume feedback is not configured' })
  if (!file || file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString() !== '%PDF-') {
    return res.status(400).json({ error: 'Upload a valid PDF under 8 MB' })
  }

  try {
    const form = new FormData()
    form.set('file', new Blob([file.buffer], { type: 'application/pdf' }), file.originalname || 'resume.pdf')
    form.set('roles', String(req.body?.role || 'software_engineering_intern'))
    form.set('enrich', 'false')
    const headers: Record<string, string> = {}
    if (process.env.HACKER_AGENT_RANK_API_KEY) headers.Authorization = `Bearer ${process.env.HACKER_AGENT_RANK_API_KEY}`
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/evaluate`, {
      method: 'POST', headers, body: form, signal: AbortSignal.timeout(90_000),
    })
    if (!response.ok) return res.status(502).json({ error: 'Resume feedback service could not complete the evaluation' })
    res.json(await response.json())
  } catch {
    res.status(502).json({ error: 'Resume feedback service is unavailable. Please try again later.' })
  }
})

const MAX_LATEX_LENGTH = 100_000
const baseSelect = 'id, filename, label, latex_source, pdf_url, base_version_id, created_at, updated_at'

// Create and edit source-only resume versions. Compilation is deliberately externalized.
router.post('/create', async (req, res) => {
  const label = String(req.body?.label || '').trim().slice(0, 120)
  const latexSource = String(req.body?.latex_source || '')
  if (!label || !latexSource || latexSource.length > MAX_LATEX_LENGTH) return res.status(400).json({ error: 'A name and LaTeX source under 100 KB are required' })
  const { data, error } = await supabase.from('resume_versions').insert({ filename: `${label}.tex`, label, latex_source: latexSource }).select(baseSelect).single()
  if (error) return res.status(500).json({ error: 'Failed to create resume' })
  res.status(201).json({ resume: data })
})

router.patch('/:id', async (req, res) => {
  const updates: Record<string, string> = {}
  if (typeof req.body?.label === 'string' && req.body.label.trim()) updates.label = req.body.label.trim().slice(0, 120)
  if (typeof req.body?.latex_source === 'string') {
    if (!req.body.latex_source || req.body.latex_source.length > MAX_LATEX_LENGTH) return res.status(400).json({ error: 'LaTeX source must be under 100 KB' })
    updates.latex_source = req.body.latex_source
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid updates supplied' })
  const { data, error } = await supabase.from('resume_versions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', req.params.id).select(baseSelect).maybeSingle()
  if (error) return res.status(500).json({ error: 'Failed to update resume' })
  if (!data) return res.status(404).json({ error: 'Resume not found' })
  res.json({ resume: data })
})

router.post('/:id/duplicate', async (req, res) => {
  const { data: original } = await supabase.from('resume_versions').select('filename, label, latex_source').eq('id', req.params.id).maybeSingle()
  if (!original) return res.status(404).json({ error: 'Resume not found' })
  const label = String(req.body?.label || `${original.label} copy`).trim().slice(0, 120)
  const { data, error } = await supabase.from('resume_versions').insert({ filename: `${label}.tex`, label, latex_source: original.latex_source, base_version_id: req.params.id }).select(baseSelect).single()
  if (error) return res.status(500).json({ error: 'Failed to duplicate resume' })
  res.status(201).json({ resume: data })
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('resume_versions').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: 'Failed to delete resume' })
  res.status(204).send()
})

router.get('/:id/download', async (req, res) => {
  const { data: resume } = await supabase.from('resume_versions').select('pdf_url').eq('id', req.params.id).maybeSingle()
  if (!resume?.pdf_url) return res.status(404).json({ error: 'No compiled PDF is available' })
  // Legacy rows may contain URLs; new private PDFs must use an object path.
  if (/^https?:\/\//.test(resume.pdf_url)) return res.status(409).json({ error: 'Recompile this legacy resume with the secure compiler before downloading' })
  const { data, error } = await supabase.storage.from('resumes').createSignedUrl(resume.pdf_url, 60)
  if (error || !data) return res.status(500).json({ error: 'Failed to prepare secure download' })
  res.json({ url: data.signedUrl })
})

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
      .select(baseSelect)
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
      .select(baseSelect)
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
