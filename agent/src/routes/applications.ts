import { Router } from 'express'
import { randomUUID } from 'crypto'
import { supabase } from '../config/supabase'
import {
  decodeStoredStage,
  encodeStageForLegacyDatabase,
  readApplicationMetadata,
  storedStageFromNotes,
  TRACKER_STATUSES,
  type TrackerStatus,
  writeApplicationMetadata,
} from '../services/timeline-parser'

const router = Router()

// GET /api/applications - Get all applications and their opportunities.
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .order('applied_date', { ascending: false })

    if (error) throw error
    res.json((data || []).map(decodeStoredStage))
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

// POST /api/applications - Track an application without an unnecessary AI round trip.
router.post('/', async (req, res) => {
  try {
    const { opportunity_id, applied_date, status = 'applied', resume_version, referral_name, notes } = req.body || {}
    if (!opportunity_id) return res.status(400).json({ error: 'opportunity_id is required' })

    const { data: existing, error: existingError } = await supabase
      .from('applications')
      .select('*')
      .eq('opportunity_id', opportunity_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) return res.json({ ...decodeStoredStage(existing), alreadyTracked: true })

    let { data, error } = await supabase
      .from('applications')
      .insert({
        opportunity_id,
        applied_date: applied_date || new Date().toISOString().slice(0, 10),
        status,
        resume_version: resume_version || null,
        referral_name: referral_name || null,
        notes: notes || 'Tracked from the opportunity page',
      })
      .select()
      .single()

    if (error?.code === '23514' && TRACKER_STATUSES.includes(status as TrackerStatus)) {
      const legacy = encodeStageForLegacyDatabase(status as TrackerStatus, notes || 'Tracked from the opportunity page')
      const retry = await supabase
        .from('applications')
        .insert({
          opportunity_id,
          applied_date: applied_date || new Date().toISOString().slice(0, 10),
          status: legacy.status,
          resume_version: resume_version || null,
          referral_name: referral_name || null,
          notes: legacy.notes,
        })
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    res.status(201).json(decodeStoredStage(data))
  } catch (error) {
    console.error('Error creating application:', error)
    res.status(500).json({ error: 'Failed to track application' })
  }
})

router.post('/:id/deadlines', async (req, res) => {
  try {
    const label = String(req.body?.label || '').trim()
    const dueDate = String(req.body?.due_date || '')
    if (!label) return res.status(400).json({ error: 'Deadline label is required' })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return res.status(400).json({ error: 'A valid deadline date is required' })
    }

    const { data: existing, error: existingError } = await supabase
      .from('applications')
      .select('notes')
      .eq('id', req.params.id)
      .single()
    if (existingError || !existing) return res.status(404).json({ error: 'Application not found' })

    const metadata = readApplicationMetadata(existing.notes)
    const deadline = {
      id: randomUUID(),
      label,
      due_date: dueDate,
      completed: false,
    }
    const notes = writeApplicationMetadata(
      metadata.notes,
      metadata.stage,
      [...metadata.deadlines, deadline],
    )
    const { data, error } = await supabase
      .from('applications')
      .update({ notes })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error || !data) throw error || new Error('Application not found')
    res.status(201).json(decodeStoredStage(data))
  } catch (error) {
    console.error('Error adding application deadline:', error)
    res.status(500).json({ error: 'Failed to add deadline' })
  }
})

router.patch('/:id/deadlines/:deadlineId', async (req, res) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('applications')
      .select('notes')
      .eq('id', req.params.id)
      .single()
    if (existingError || !existing) return res.status(404).json({ error: 'Application not found' })

    const metadata = readApplicationMetadata(existing.notes)
    let found = false
    const deadlines = metadata.deadlines.map(deadline => {
      if (deadline.id !== req.params.deadlineId) return deadline
      found = true
      return {
        ...deadline,
        label: typeof req.body?.label === 'string' && req.body.label.trim()
          ? req.body.label.trim()
          : deadline.label,
        due_date: typeof req.body?.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.due_date)
          ? req.body.due_date
          : deadline.due_date,
        completed: typeof req.body?.completed === 'boolean' ? req.body.completed : deadline.completed,
      }
    })
    if (!found) return res.status(404).json({ error: 'Deadline not found' })

    const notes = writeApplicationMetadata(metadata.notes, metadata.stage, deadlines)
    const { data, error } = await supabase
      .from('applications')
      .update({ notes })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error || !data) throw error || new Error('Application not found')
    res.json(decodeStoredStage(data))
  } catch (error) {
    console.error('Error updating application deadline:', error)
    res.status(500).json({ error: 'Failed to update deadline' })
  }
})

router.delete('/:id/deadlines/:deadlineId', async (req, res) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('applications')
      .select('notes')
      .eq('id', req.params.id)
      .single()
    if (existingError || !existing) return res.status(404).json({ error: 'Application not found' })

    const metadata = readApplicationMetadata(existing.notes)
    const deadlines = metadata.deadlines.filter(deadline => deadline.id !== req.params.deadlineId)
    if (deadlines.length === metadata.deadlines.length) {
      return res.status(404).json({ error: 'Deadline not found' })
    }

    const notes = writeApplicationMetadata(metadata.notes, metadata.stage, deadlines)
    const { data, error } = await supabase
      .from('applications')
      .update({ notes })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error || !data) throw error || new Error('Application not found')
    res.json(decodeStoredStage(data))
  } catch (error) {
    console.error('Error deleting application deadline:', error)
    res.status(500).json({ error: 'Failed to delete deadline' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'applied_date',
      'status',
      'resume_version',
      'referral_name',
      'follow_up_sent',
      'follow_up_date',
      'notes',
    ]
    let updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key)),
    )

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const { data: existing, error: existingError } = await supabase
      .from('applications')
      .select('status, notes')
      .eq('id', req.params.id)
      .single()
    if (existingError || !existing) throw existingError || new Error('Application not found')

    const metadata = readApplicationMetadata(existing.notes)
    const storedStage = storedStageFromNotes(existing.notes)
    if ('notes' in updates && !('status' in updates)) {
      updates.notes = writeApplicationMetadata(
        String(updates.notes || '') || null,
        storedStage,
        metadata.deadlines,
      )
    }
    if (
      typeof updates.status === 'string'
      && TRACKER_STATUSES.includes(updates.status as TrackerStatus)
      && encodeStageForLegacyDatabase(updates.status as TrackerStatus, null).status === updates.status
      && !('notes' in updates)
    ) {
      updates.notes = writeApplicationMetadata(
        metadata.notes,
        null,
        metadata.deadlines,
      )
    }

    let { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (
      error?.code === '23514'
      && typeof updates.status === 'string'
      && TRACKER_STATUSES.includes(updates.status as TrackerStatus)
    ) {
      const legacy = encodeStageForLegacyDatabase(
        updates.status as TrackerStatus,
        'notes' in updates ? String(updates.notes || '') : existing.notes,
      )
      updates = { ...updates, status: legacy.status, notes: legacy.notes }
      const retry = await supabase
        .from('applications')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error || !data) throw error || new Error('Application not found')
    res.json(decodeStoredStage(data))
  } catch (error) {
    console.error('Error updating application:', error)
    res.status(500).json({ error: 'Failed to update application' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('applications').delete().eq('id', req.params.id)
    if (error) throw error
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting application:', error)
    res.status(500).json({ error: 'Failed to delete application' })
  }
})

export default router
