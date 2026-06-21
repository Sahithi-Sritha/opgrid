import { chromium } from 'playwright'
import { Opportunity } from '../../config/supabase'

export async function scrapeMyCareerNet(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  
  try {
    const page = await context.newPage()
    
    // Try public internships page (no login required)
    await page.goto('https://www.mycareernetwork.co.in/internships', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    })
    
    // Wait for content to load
    await page.waitForTimeout(3000)
    
    // Extract internship cards
    const cards = await page.locator('.internship-card, .job-card, [class*="internship"]').all()
    
    for (const card of cards) {
      try {
        const title = await card.locator('h2, h3, .title, [class*="title"]').first().textContent() || ''
        const company = await card.locator('.company, [class*="company"]').first().textContent() || 'Unknown'
        const link = await card.locator('a').first().getAttribute('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://www.mycareernetwork.co.in${link}`
        
        // Extract location
        const location = await card.locator('.location, [class*="location"]').first().textContent() || null
        const is_remote = location?.toLowerCase().includes('remote') || false
        
        // Extract stipend
        const stipend = await card.locator('.stipend, [class*="stipend"]').first().textContent() || null
        
        // Extract duration
        const duration = await card.locator('.duration, [class*="duration"]').first().textContent() || null
        
        if (title && fullUrl) {
          opportunities.push({
            title: title.trim(),
            company: company.trim(),
            source: 'career_page',
            url: fullUrl,
            description: `${title} at ${company}`,
            tags: [],
            deadline: null,
            stipend: stipend?.trim() || null,
            location: location?.trim() || null,
            is_remote,
            raw_html: null,
            category: 'internship',
            prize_pool: null,
            team_size: null,
            ppo_possible: false,
            registration_open: true,
            event_date: null
          })
        }
      } catch (err) {
        console.error('    Error parsing MyCareerNet card:', err)
      }
    }
    
    await page.close()
    
  } catch (error) {
    console.error('MyCareerNet scraper error:', error)
  } finally {
    await browser.close()
  }
  
  return opportunities
}
