require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { chromium } = require('playwright')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const frontendUrl = process.env.SMOKE_FRONTEND_URL || 'http://127.0.0.1:3000'
const suffix = Date.now()
const primaryTitle = `Opportunity UI Smoke Test ${suffix}`
const companionTitle = `UI Smoke Companion ${suffix}`
const company = `Codex Test ${suffix}`

async function insertOpportunity(title, url, description) {
  const deadline = new Date()
  deadline.setUTCDate(deadline.getUTCDate() + 10)

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      title,
      company,
      source: 'career_page',
      url,
      description,
      tags: ['internship', 'remote', 'beginner_friendly'],
      deadline: deadline.toISOString().slice(0, 10),
      stipend: 'Test stipend',
      location: 'Remote',
      is_remote: true,
      category: 'internship',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function main() {
  let browser
  let primary
  let companion

  try {
    primary = await insertOpportunity(
      primaryTitle,
      `https://example.com/opgrid-smoke-${suffix}`,
      'Synthetic opportunity used to verify every feed and detail action.',
    )
    companion = await insertOpportunity(
      companionTitle,
      `https://example.com/opgrid-smoke-companion-${suffix}`,
      'Synthetic related opportunity used to verify similar-opportunity navigation.',
    )

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const browserErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
        browserErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('response', (response) => {
      if (response.status() >= 400) {
        browserErrors.push(`HTTP ${response.status()} ${response.url()}`)
      }
    })
    await page.goto(`${frontendUrl}/feed`, { waitUntil: 'networkidle' })

    await page.getByText('Agent online', { exact: true }).waitFor()
    for (const filterName of [
      'All',
      'Internships',
      'Hackathons',
      'Fellowships',
      'Remote',
      'Paid',
      'PPO possible',
      'Beginner friendly',
    ]) {
      const filterButton = page.getByRole('button', { name: filterName, exact: true })
      await filterButton.click()
      if ((await filterButton.getAttribute('aria-pressed')) !== 'true') {
        throw new Error(`${filterName} filter did not become active`)
      }
    }

    await page.getByRole('button', { name: 'Internships', exact: true }).click()
    await page.getByPlaceholder('Search by title, company, location, or tag').fill('temporary search')
    await page.getByRole('button', { name: 'Clear search', exact: true }).click()
    await page.getByPlaceholder('Search by title, company, location, or tag').fill(company)
    await page.getByRole('combobox', { name: 'Sort opportunities' }).selectOption('deadline')

    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/opportunities?')),
      page.getByRole('button', { name: 'Refresh', exact: true }).click(),
    ])

    const primaryCard = page.locator('article').filter({ hasText: primaryTitle })
    await primaryCard.waitFor()
    const cardLink = primaryCard.getByRole('link', { name: /View posting/ })
    if ((await cardLink.getAttribute('href')) !== primary.url) {
      throw new Error('Feed posting link does not match the opportunity URL')
    }

    await primaryCard.click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('heading', { name: primaryTitle }).waitFor()

    const postingLink = dialog.getByRole('link', { name: /Open posting/ })
    if ((await postingLink.getAttribute('href')) !== primary.url) {
      throw new Error('Detail posting link does not match the opportunity URL')
    }

    await dialog.getByRole('button', { name: 'Save for later', exact: true }).click()
    await dialog.getByText('Saved for later.', { exact: true }).waitFor()

    await dialog.getByRole('button', { name: '3 days', exact: true }).click()
    await dialog.getByText('Reminder set for 3 days before the deadline.', { exact: true }).waitFor()

    await dialog.getByRole('button', { name: 'I applied', exact: true }).click()
    await dialog.getByText('Application tracked — nice work.', { exact: true }).waitFor()

    const artifactDir = path.resolve(__dirname, '..', '..', 'artifacts')
    fs.mkdirSync(artifactDir, { recursive: true })
    await page.screenshot({
      path: path.join(artifactDir, 'opportunity-page-verified.png'),
      fullPage: true,
    })

    await dialog.getByRole('button', { name: new RegExp(companionTitle) }).click()
    await dialog.getByRole('heading', { name: companionTitle }).waitFor()
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await dialog.waitFor({ state: 'detached' })

    await page.getByPlaceholder('Search by title, company, location, or tag').fill(primaryTitle)
    await page.locator('article').filter({ hasText: primaryTitle }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Analyze JD', exact: true }).click()
    await page.waitForURL((url) => {
      const pathname = url.pathname.replace(/\/$/, '')
      return pathname === '/resume' && url.searchParams.get('opp') === primary.id
    })

    const [{ data: application }, { data: saved }] = await Promise.all([
      supabase.from('applications').select('id').eq('opportunity_id', primary.id).maybeSingle(),
      supabase.from('saved_opportunities').select('reminder_date').eq('opportunity_id', primary.id).maybeSingle(),
    ])

    if (!application) throw new Error('Applied action did not create an application record')
    if (!saved?.reminder_date) throw new Error('Reminder action did not persist a reminder date')
    if (browserErrors.length) {
      throw new Error(`Browser console errors: ${browserErrors.join(' | ')}`)
    }

    console.log(JSON.stringify({
      passed: true,
      checks: [
        'agent status',
        'all filters',
        'search and clear',
        'sort',
        'refresh',
        'card details',
        'posting links',
        'save',
        'reminder',
        'applied',
        'similar opportunity',
        'close',
        'analyze JD navigation',
      ],
      screenshot: path.resolve(__dirname, '..', '..', 'artifacts', 'opportunity-page-verified.png'),
    }, null, 2))
  } finally {
    if (browser) await browser.close()
    const ids = [primary?.id, companion?.id].filter(Boolean)
    if (ids.length) {
      const { error } = await supabase.from('opportunities').delete().in('id', ids)
      if (error) console.error('Smoke-test cleanup failed:', error)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
