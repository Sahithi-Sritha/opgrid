import { Router } from 'express'
import { supabase } from '../config/supabase'

const router = Router()

const clamp = (value: unknown, fallback: number, max: number) => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), max) : fallback
}

// GET /api/opportunities - Get opportunities with filtering and pagination.
router.get('/', async (req, res) => {
  try {
    const limit = clamp(req.query.limit, 50, 200)
    const offset = clamp(req.query.offset, 0, 10_000)
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all'

    let request = supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter !== 'all') {
      if (filter === 'remote') {
        request = request.eq('is_remote', true)
      } else if (filter === 'stipend') {
        request = request.not('stipend', 'is', null)
      } else if (filter === 'ppo_possible') {
        request = request.eq('ppo_possible', true)
      } else if (/^[a-z0-9_]+$/.test(filter)) {
        request = request.or(`category.eq.${filter},source.eq.${filter},tags.cs.{${filter}}`)
      }
    }

    const { data, error } = await request
    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    res.status(500).json({ error: 'Failed to fetch opportunities' })
  }
})

// GET /api/opportunities/search - Search opportunities.
router.get('/search', async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!rawQuery) return res.status(400).json({ error: 'Query parameter required' })

    const safeQuery = rawQuery.replace(/[,%()]/g, ' ').slice(0, 100)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .or(`title.ilike.%${safeQuery}%,company.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error searching opportunities:', error)
    res.status(500).json({ error: 'Failed to search opportunities' })
  }
})

// GET /api/opportunities/:id/similar - Get related opportunities.
router.get('/:id/similar', async (req, res) => {
  try {
    const { data: target, error: targetError } = await supabase
      .from('opportunities')
      .select('id, company, category')
      .eq('id', req.params.id)
      .single()

    if (targetError || !target) return res.status(404).json({ error: 'Opportunity not found' })

    const requests = [
      supabase
        .from('opportunities')
        .select('*')
        .eq('company', target.company)
        .neq('id', target.id)
        .limit(5),
    ]

    if (target.category) {
      requests.push(
        supabase
          .from('opportunities')
          .select('*')
          .eq('category', target.category)
          .neq('id', target.id)
          .limit(5),
      )
    }

    const results = await Promise.all(requests)
    const unique = new Map<string, any>()

    for (const result of results) {
      if (result.error) throw result.error
      for (const item of result.data || []) unique.set(item.id, item)
    }

    res.json(Array.from(unique.values()).slice(0, 5))
  } catch (error) {
    console.error('Error fetching similar opportunities:', error)
    res.status(500).json({ error: 'Failed to fetch similar opportunities' })
  }
})

// POST /api/opportunities/:id/save - Save for later.
router.post('/:id/save', async (req, res) => {
  try {
    const { error } = await supabase
      .from('saved_opportunities')
      .upsert({ opportunity_id: req.params.id }, { onConflict: 'user_id,opportunity_id' })

    if (error) throw error
    res.json({ saved: true })
  } catch (error) {
    console.error('Error saving opportunity:', error)
    res.status(500).json({ error: 'Failed to save opportunity' })
  }
})

// DELETE /api/opportunities/:id/save - Remove from saved opportunities.
router.delete('/:id/save', async (req, res) => {
  try {
    const { error } = await supabase
      .from('saved_opportunities')
      .delete()
      .eq('opportunity_id', req.params.id)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    console.error('Error removing saved opportunity:', error)
    res.status(500).json({ error: 'Failed to remove saved opportunity' })
  }
})

// POST /api/opportunities/:id/reminder - Save and schedule a reminder.
router.post('/:id/reminder', async (req, res) => {
  try {
    const daysBefore = clamp(req.body?.days_before, 1, 365)
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('deadline')
      .eq('id', req.params.id)
      .single()

    if (opportunityError || !opportunity) return res.status(404).json({ error: 'Opportunity not found' })
    if (!opportunity.deadline) return res.status(400).json({ error: 'This opportunity has no deadline' })

    const reminder = new Date(`${opportunity.deadline}T12:00:00Z`)
    reminder.setUTCDate(reminder.getUTCDate() - daysBefore)
    const reminderDate = reminder.toISOString().slice(0, 10)

    const { error } = await supabase
      .from('saved_opportunities')
      .upsert(
        { opportunity_id: req.params.id, reminder_date: reminderDate },
        { onConflict: 'user_id,opportunity_id' },
      )

    if (error) throw error
    res.json({ saved: true, reminder_date: reminderDate })
  } catch (error) {
    console.error('Error setting reminder:', error)
    res.status(500).json({ error: 'Failed to set reminder' })
  }
})

// GET /api/opportunities/:id - Get a single opportunity.
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Opportunity not found' })
    res.json(data)
  } catch (error) {
    console.error('Error fetching opportunity:', error)
    res.status(500).json({ error: 'Failed to fetch opportunity' })
  }
})

// PATCH /api/opportunities/:id - Update fields edited by the frontend.
router.patch('/:id', async (req, res) => {
  try {
    const allowedFields = ['seen_at']
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key)),
    )

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    if (!updates.seen_at) return res.status(400).json({ error: 'Only seen_at may be updated' })

    const { data, error } = await supabase
      .from('opportunity_user_state')
      .upsert({ opportunity_id: req.params.id, seen_at: updates.seen_at }, { onConflict: 'user_id,opportunity_id' })
      .select()
      .single()

    if (error || !data) throw error || new Error('Opportunity not found')
    res.json(data)
  } catch (error) {
    console.error('Error updating opportunity:', error)
    res.status(500).json({ error: 'Failed to update opportunity' })
  }
})

export default router
