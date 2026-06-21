import { Router } from 'express'
import { supabase } from '../config/supabase'

const router = Router()

// GET /api/applications - Get all applications and their opportunities.
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .order('applied_date', { ascending: false })

    if (error) throw error
    res.json(data || [])
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
    if (existing) return res.json({ ...existing, alreadyTracked: true })

    const { data, error } = await supabase
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

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating application:', error)
    res.status(500).json({ error: 'Failed to track application' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'status',
      'resume_version',
      'referral_name',
      'follow_up_sent',
      'follow_up_date',
      'notes',
    ]
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key)),
    )

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error || !data) throw error || new Error('Application not found')
    res.json(data)
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
