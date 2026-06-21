import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import cron from 'node-cron'
import path from 'path'
import { startScrapers, runHackathonScrapers } from './scheduler/jobs'
import { sendDailyDigest } from './notifier/email'
import { checkDeadlines, checkFollowUps } from './scheduler/deadlines'
import resumeRoutes from './routes/resume'
import jdRoutes from './routes/jd'
import resumeEditRoutes from './routes/resume-edit'
import resumeCompileRoutes from './routes/resume-compile'
import applyIntentRoutes from './routes/apply-intent'
import telegramWebhookRoutes from './routes/telegram-webhook'
import scraperHealthRoutes from './routes/scraper-health'
import deduplicationRoutes from './routes/deduplication'
import sourcesRoutes from './routes/sources'
import trackerRoutes from './routes/tracker'
import opportunityRoutes from './routes/opportunities'
import applicationRoutes from './routes/applications'

const app = express()
const port = Number.parseInt(process.env.PORT || '3001', 10)
const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata'
const schedulerEnabled = process.env.ENABLE_SCHEDULER !== 'false'
const runInitialScrape = process.env.RUN_INITIAL_SCRAPE !== 'false'
const runningJobs = new Set<string>()

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Origin not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '2mb' }))

app.use('/api/resume', resumeRoutes)
app.use('/api/jd', jdRoutes)
app.use('/api/resume', resumeEditRoutes)
app.use('/api/resume', resumeCompileRoutes)
app.use('/api/apply', applyIntentRoutes)
app.use('/api/telegram', telegramWebhookRoutes)
app.use('/api/scrapers', scraperHealthRoutes)
app.use('/api/opportunities', opportunityRoutes)
app.use('/api/opportunities', deduplicationRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/sources', sourcesRoutes)
app.use('/api/tracker', trackerRoutes)

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    scheduler: {
      enabled: schedulerEnabled,
      timezone,
      runningJobs: Array.from(runningJobs),
    },
    timestamp: new Date().toISOString(),
  })
})

const frontendDirectory = path.resolve(process.cwd(), 'public')
app.use(express.static(frontendDirectory, { redirect: true }))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    next()
    return
  }

  res.sendFile(path.join(frontendDirectory, 'index.html'), (error) => {
    if (error) next()
  })
})

async function runJob(name: string, job: () => Promise<unknown>) {
  if (runningJobs.has(name)) {
    console.warn(`[scheduler] Skipping overlapping ${name} run`)
    return false
  }

  runningJobs.add(name)
  const startedAt = Date.now()
  console.log(`[scheduler] Starting ${name}`)

  try {
    await job()
    console.log(`[scheduler] Finished ${name} in ${Date.now() - startedAt}ms`)
    return true
  } catch (error) {
    console.error(`[scheduler] ${name} failed:`, error)
    return false
  } finally {
    runningJobs.delete(name)
  }
}

app.post('/trigger-scrape', async (_req, res) => {
  const started = await runJob('internship-scrape', startScrapers)
  res.status(started ? 200 : 409).json({
    message: started ? 'Internship scraping completed' : 'Internship scraper is already running',
  })
})

app.post('/trigger-hackathons', async (_req, res) => {
  const started = await runJob('hackathon-scrape', runHackathonScrapers)
  res.status(started ? 200 : 409).json({
    message: started ? 'Hackathon scraping completed' : 'Hackathon scraper is already running',
  })
})

function schedule(name: string, expression: string, job: () => Promise<unknown>) {
  if (!cron.validate(expression)) {
    throw new Error(`Invalid cron expression for ${name}: ${expression}`)
  }

  cron.schedule(expression, () => {
    void runJob(name, job)
  }, { timezone })
}

function setupCronJobs() {
  if (!schedulerEnabled) {
    console.log('[scheduler] Disabled by ENABLE_SCHEDULER=false')
    return
  }

  schedule('internship-scrape', process.env.INTERNSHIP_CRON || '*/10 * * * *', startScrapers)
  schedule('hackathon-scrape', process.env.HACKATHON_CRON || '5-59/10 * * * *', runHackathonScrapers)
  schedule('daily-digest', process.env.DIGEST_CRON || '0 9 * * *', sendDailyDigest)
  schedule('deadline-check', process.env.DEADLINE_CRON || '0 8 * * *', checkDeadlines)
  schedule('follow-up-check', process.env.FOLLOW_UP_CRON || '0 10 * * *', checkFollowUps)
  schedule('deduplication', process.env.DEDUPLICATION_CRON || '0 2 * * 0', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/opportunities/deduplicate`, {
      method: 'POST',
    })
    if (!response.ok) throw new Error(`Deduplication returned HTTP ${response.status}`)
  })

  console.log(`[scheduler] Jobs scheduled in ${timezone}`)
}

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`OpGrid Agent listening on port ${port}`)
  setupCronJobs()

  if (schedulerEnabled && runInitialScrape) {
    setTimeout(() => {
      void runJob('internship-scrape', startScrapers)
      void runJob('hackathon-scrape', runHackathonScrapers)
    }, 5_000)
  }
})

function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`)
  server.close((error) => {
    if (error) {
      console.error('Failed to close HTTP server:', error)
      process.exit(1)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
})
