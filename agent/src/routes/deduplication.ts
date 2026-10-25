import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import { supabase } from '../config/supabase'
import { canonicalOpportunityUrl, opportunityFingerprint } from '../services/opportunity-identity'

const router = Router()

// Deterministic deduplication: no LLM calls and no risky fuzzy matching.
router.post('/deduplicate', requireAdmin, async (_req, res) => {
  try {
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('id, url, title, company, description, created_at')
      .order('created_at', { ascending: true })
    if (error) throw error

    const seen = new Map<string, any>()
    const duplicates: Array<{ primary: any; duplicate: any }> = []
    for (const opportunity of opportunities || []) {
      const keys = [`url:${canonicalOpportunityUrl(opportunity.url)}`, `title:${opportunityFingerprint(opportunity)}`]
      const primary = keys.map(key => seen.get(key)).find(Boolean)
      if (primary) {
        duplicates.push({ primary, duplicate: opportunity })
        continue
      }
      for (const key of keys) seen.set(key, opportunity)
    }

    let merged = 0
    for (const { primary, duplicate } of duplicates) {
      const keep = String(primary.description || '').length >= String(duplicate.description || '').length ? primary : duplicate
      const remove = keep === primary ? duplicate : primary
      const update = await supabase.from('applications').update({ opportunity_id: keep.id }).eq('opportunity_id', remove.id)
      if (update.error) throw update.error
      const deletion = await supabase.from('opportunities').delete().eq('id', remove.id)
      if (deletion.error) throw deletion.error
      merged++
    }

    res.json({ duplicates_found: duplicates.length, merged, message: `Deterministic deduplication merged ${merged} records` })
  } catch (error) {
    console.error('Deduplication error:', error)
    res.status(500).json({ error: 'Deduplication failed' })
  }
})

export default router
