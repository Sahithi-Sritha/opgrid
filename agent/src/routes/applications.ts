import { Router } from 'express'
import { supabase } from '../config/supabase'
import {
  decodeStoredStage,
  encodeStageForLegacyDatabase,
  storedStageFromNotes,
  TRACKER_STATUSES,
  type TrackerStatus,
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

    const storedStage = storedStageFromNotes(existing.notes)
    if ('notes' in updates && storedStage && !('status' in updates)) {
      updates.notes = `${String(updates.notes || '').trim()}${updates.notes ? '\n' : ''}[[opgrid_stage:${storedStage}]]`
    }
    if (
      typeof updates.status === 'string'
      && TRACKER_STATUSES.includes(updates.status as TrackerStatus)
      && encodeStageForLegacyDatabase(updates.status as TrackerStatus, null).status === updates.status
      && !('notes' in updates)
    ) {
      updates.notes = decodeStoredStage(existing).notes
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
