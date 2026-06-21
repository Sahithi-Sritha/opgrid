import { chromium } from 'playwright'
import { Opportunity } from '../../config/supabase'

export async function scrapeDevfolio(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  
  try {
    const page = await context.newPage()
    await page.goto('https://devfolio.co/hackathons', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    })
    
    // Filter to open hackathons if filter exists
    try {
      const openFilter = page.locator('button:has-text("Open"), [data-filter="open"]')
      if (await openFilter.isVisible({ timeout: 3000 })) {
        await openFilter.click()
        await page.waitForTimeout(2000)
      }
    } catch {}
    
    // Extract hackathon cards
    const cards = await page.locator('[class*="hackathon"], [class*="card"]').all()
    
    for (const card of cards) {
      try {
        const title = await card.locator('h2, h3, [class*="title"]').first().textContent() || ''
        const organizer = await card.locator('[class*="organizer"], [class*="host"]').first().textContent() || 'Devfolio'
        const link = await card.locator('a').first().getAttribute('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://devfolio.co${link}`
        
        // Extract prizes
        const prizeText = await card.locator('[class*="prize"]').first().textContent() || null
        
        // Extract date
        const dateText = await card.locator('[class*="date"]').first().textContent() || ''
        let event_date = null
        const dateMatch = dateText.match(/(\w+\s+\d{1,2})[,\s-]+(\d{4})/)
        if (dateMatch) {
          const [, dateStr, year] = dateMatch
          event_date = new Date(`${dateStr} ${year}`).toISOString().split('T')[0]
        }
        
        // Extract team size
        const teamSizeText = await card.locator('[class*="team"]').first().textContent() || null
        
        if (title && fullUrl) {
          opportunities.push({
            title: title.trim(),
            company: organizer.trim(),
            source: 'hackathon',
            url: fullUrl,
            description: `${title} hackathon on Devfolio`,
            tags: [],
            deadline: null,
            stipend: null,
            location: 'Online',
            is_remote: true,
            raw_html: null,
            category: 'hackathon',
            prize_pool: prizeText?.trim() || null,
            team_size: teamSizeText?.trim() || null,
            ppo_possible: false,
            registration_open: true,
            event_date
          })
        }
      } catch (err) {
        console.error('    Error parsing Devfolio card:', err)
      }
    }
    
    await page.close()
    
  } catch (error) {
    console.error('Devfolio scraper error:', error)
  } finally {
    await browser.close()
  }
  
  return opportunities
}
