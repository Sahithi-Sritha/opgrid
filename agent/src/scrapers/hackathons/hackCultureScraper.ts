import { chromium } from 'playwright'
import { Opportunity } from '../../config/supabase'

export async function scrapeHackCulture(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  
  try {
    const page = await context.newPage()
    
    // First check if there's an API
    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.url().includes('hackathon')) {
        try {
          const data = await response.json()
          console.log('    Found HackCulture API:', response.url())
          // If API data is found, you can parse it here
        } catch {}
      }
    })
    
    await page.goto('https://hackculture.in/hackathons', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    })
    
    // Wait for content to load
    await page.waitForTimeout(3000)
    
    // Extract hackathon cards
    const cards = await page.locator('.hackathon-card, .event-card, [class*="hackathon"]').all()
    
    for (const card of cards) {
      try {
        const title = await card.locator('h2, h3, .title, [class*="title"]').first().textContent() || ''
        const organizer = await card.locator('.organizer, .company, [class*="organizer"]').first().textContent() || 'HackCulture'
        const link = await card.locator('a').first().getAttribute('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://hackculture.in${link}`
        
        // Extract date
        const dateText = await card.locator('.date, [class*="date"]').first().textContent() || ''
        let event_date = null
        const dateMatch = dateText.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/)
        if (dateMatch) {
          const [, day, month, year] = dateMatch
          event_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        
        // Extract prize
        const prizeText = await card.locator('.prize, [class*="prize"]').first().textContent() || null
        
        // Extract mode (online/offline)
        const modeText = await card.locator('.mode, [class*="mode"]').first().textContent() || ''
        const is_remote = modeText.toLowerCase().includes('online')
        
        if (title && fullUrl) {
          opportunities.push({
            title: title.trim(),
            company: organizer.trim(),
            source: 'hackathon',
            url: fullUrl,
            description: `${title} - ${modeText}`,
            tags: [],
            deadline: null, // Will be extracted from detail page if needed
            stipend: null,
            location: is_remote ? 'Online' : modeText.trim(),
            is_remote,
            raw_html: null,
            category: 'hackathon',
            prize_pool: prizeText?.trim() || null,
            team_size: null,
            ppo_possible: false,
            registration_open: true,
            event_date
          })
        }
      } catch (err) {
        console.error('    Error parsing HackCulture card:', err)
      }
    }
    
    await page.close()
    
  } catch (error) {
    console.error('HackCulture scraper error:', error)
  } finally {
    await browser.close()
  }
  
  return opportunities
}
