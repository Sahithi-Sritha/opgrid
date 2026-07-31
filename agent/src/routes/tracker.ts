import { Router } from 'express'
import { randomUUID } from 'crypto'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../config/supabase'
import { getGeminiKey } from '../utils/gemini-keys'
import {
  decodeStoredStage,
  encodeStageForLegacyDatabase,
  normalizeParsedTimeline,
  parseTimelinesFallback,
  TRACKER_STATUSES,
  type ParsedTimeline,
  writeApplicationMetadata,
} from '../services/timeline-parser'

const router = Router()

async function createTrackedItem(item: ParsedTimeline, appliedDate?: string | null) {
  const deadlines = (item.deadlines?.length
    ? item.deadlines
    : item.deadline
      ? [{ label: 'Application deadline', due_date: item.deadline }]
      : []
  ).map(deadline => ({
    id: randomUUID(),
    label: deadline.label,
    due_date: deadline.due_date,
    completed: false,
  }))
  const encoded = encodeStageForLegacyDatabase(
    item.status,
    writeApplicationMetadata(item.notes, null, deadlines),
  )
  const opportunity = {
    title: item.title || 'Unknown Opportunity',
    company: item.company,
    deadline: item.deadline || null,
    url: item.url || `pasted-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    source: item.category === 'hackathon'
      ? 'hackathon'
      : item.category === 'fellowship'
        ? 'fellowship'
        : item.category === 'competition'
          ? 'competition'
          : 'career_page',
    category: item.category || null,
  }

  const { data: newOpportunity, error: opportunityError } = await supabase
    .from('opportunities')
    .insert(opportunity)
    .select('*')
    .single()

  if (opportunityError || !newOpportunity) {
    throw opportunityError || new Error('Failed to create opportunity')
  }

  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .insert({
      opportunity_id: newOpportunity.id,
      status: encoded.status,
      notes: encoded.notes,
      applied_date: appliedDate || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (applicationError || !application) {
    await supabase.from('opportunities').delete().eq('id', newOpportunity.id)
    throw applicationError || new Error('Failed to create application')
  }

  return decodeStoredStage({ ...application, opportunities: newOpportunity })
}

async function extractWithGemini(text: string): Promise<ParsedTimeline[]> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('Gemini is not configured')

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `Extract every job, internship, fellowship, competition, or hackathon timeline from the text below.
Return a JSON array. Each object must contain:
- company: organizer or company
- title: opportunity name
- category: one of internship, hackathon, fellowship, competition, research, or null
- deadline: the earliest upcoming date as YYYY-MM-DD or null
- deadlines: every named milestone as [{"label":"Idea submission","due_date":"2026-07-05"}]
- status: exactly one of ${TRACKER_STATUSES.join(', ')}
- notes: useful timeline context or null
- url: full URL or null

Use the current date 2026-06-22 and infer missing years sensibly. Preserve hackathon stages such as idea_submission and video_submission.

TEXT:
${text}`

  const response = await model.generateContent(prompt)
  const raw = response.response.text().replace(/```(?:json)?|```/g, '').trim()
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  const json = start >= 0 && end > start ? raw.slice(start, end + 1) : raw
  const decoded = JSON.parse(json)
  const values = Array.isArray(decoded) ? decoded : [decoded]
  return values.map(normalizeParsedTimeline).filter((item): item is ParsedTimeline => Boolean(item))
}

router.post('/parse', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!text) return res.status(400).json({ error: 'Paste some timeline text first.' })
  if (text.length > 25_000) return res.status(400).json({ error: 'Timeline text is too long. Keep it under 25,000 characters.' })

  let parsed: ParsedTimeline[] = []
  let extraction: 'ai' | 'fallback' = 'ai'

  try {
    parsed = await extractWithGemini(text)
  } catch (error) {
    extraction = 'fallback'
    console.warn('Gemini timeline extraction failed; using local parser:', error)
  }

  if (parsed.length === 0) {
    extraction = 'fallback'
    parsed = parseTimelinesFallback(text, new Date('2026-06-22T00:00:00Z'))
  }

  if (parsed.length === 0) {
    return res.status(422).json({
      error: 'I could not find an opportunity. Try one item per line, for example: "Adobe — Student Insider — apply by 30 June 2026".',
    })
  }

  const created = []
  const failures: string[] = []
  for (const item of parsed) {
    try {
      created.push(await createTrackedItem(item))
    } catch (error: any) {
      console.error('Failed to save parsed timeline:', error)
      failures.push(`${item.company}: ${error?.message || 'save failed'}`)
    }
  }

  if (created.length === 0) {
    return res.status(500).json({
      error: failures[0] || 'The opportunities were extracted but could not be saved.',
    })
  }

  res.json({
    message: `Added ${created.length} tracked ${created.length === 1 ? 'item' : 'items'}.`,
    parsed: created,
    extraction,
    skipped: failures.length,
  })
})

router.post('/manual', async (req, res) => {
  try {
    const company = String(req.body?.company || '').trim()
    const title = String(req.body?.title || '').trim()
    if (!company || !title) return res.status(400).json({ error: 'Company and opportunity title are required.' })

    const item = normalizeParsedTimeline({
      company,
      title,
      category: req.body?.category || null,
      deadline: req.body?.deadline || null,
      deadlines: Array.isArray(req.body?.deadlines) ? req.body.deadlines : undefined,
      status: req.body?.status || 'to_apply',
      notes: req.body?.notes || null,
      url: req.body?.url || null,
    })
    if (!item) return res.status(400).json({ error: 'Invalid tracking details.' })

    const application = await createTrackedItem(item, req.body?.applied_date || null)
    res.status(201).json(application)
  } catch (error: any) {
    console.error('Failed to add tracked item manually:', error)
    res.status(500).json({ error: error?.message || 'Failed to add tracked item.' })
  }
})

export default router
