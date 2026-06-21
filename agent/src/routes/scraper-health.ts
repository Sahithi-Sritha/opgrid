import { Router } from 'express'
import { supabase } from '../config/supabase'
import { runHackathonScrapers } from '../scheduler/hackathon-jobs'
import { startScrapers } from '../scheduler/jobs'

const router = Router()

// GET /api/scrapers/health
// Get health status of all scrapers
router.get('/health', async (req, res) => {
  try {
    // Get latest run for each scraper
    const { data: runs } = await supabase
      .from('scraper_runs')
      .select('*')
      .order('ran_at', { ascending: false })

    if (!runs) {
      return res.json({ scrapers: [] })
    }

    // Group by scraper name and get latest
    const scraperMap = new Map()
    
    for (const run of runs) {
      if (!scraperMap.has(run.scraper_name)) {
        scraperMap.set(run.scraper_name, run)
      }
    }

    const scrapers = Array.from(scraperMap.values()).map(run => ({
      name: run.scraper_name,
      last_run: run.ran_at,
      status: run.status || 'success',
      new_found: run.new_count || 0,
      errors: run.error_message || null,
      duration_ms: run.duration_ms
    }))

    res.json({ scrapers })

  } catch (error) {
    console.error('Scraper health check error:', error)
    res.status(500).json({ error: 'Failed to check scraper health' })
  }
})

// POST /api/scrapers/run
// Manually trigger a specific scraper
router.post('/run', async (req, res) => {
  try {
    const { scraper } = req.query

    if (!scraper || typeof scraper !== 'string') {
      return res.status(400).json({ error: 'Scraper name required' })
    }

    console.log(`→ Manual trigger: ${scraper}`)

    const startTime = Date.now()
    let newCount = 0
    let error = null

    try {
      // Trigger specific scraper based on name
      if (scraper === 'all_internships') {
        await startScrapers()
      } else if (scraper === 'all_hackathons') {
        newCount = await runHackathonScrapers()
      } else {
        return res.status(400).json({ error: 'Unknown scraper' })
      }

      const duration = Date.now() - startTime

      // Log the run
      await supabase.from('scraper_runs').insert({
        scraper_name: scraper,
        new_count: newCount,
        duration_ms: duration,
        status: 'success'
      })

      res.json({
        success: true,
        scraper,
        new_count: newCount,
        duration_ms: duration
      })

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      
      await supabase.from('scraper_runs').insert({
        scraper_name: scraper,
        error_message: error,
        duration_ms: Date.now() - startTime,
        status: 'error'
      })

      res.status(500).json({ error })
    }

  } catch (error) {
    console.error('Manual scraper run error:', error)
    res.status(500).json({ error: 'Failed to run scraper' })
  }
})

export default router
