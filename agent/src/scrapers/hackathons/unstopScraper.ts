import { chromium } from 'playwright'
import { Opportunity } from '../../config/supabase'

export async function scrapeUnstop(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  
  try {
    const urls = [
      'https://unstop.com/hackathons',
      'https://unstop.com/competitions'
    ]

    for (const url of urls) {
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      
      // Load more content by clicking "Load more" button
      let loadMoreClicks = 0
      const maxPages = 5
      
      while (loadMoreClicks < maxPages) {
        try {
          const loadMoreBtn = page.locator('button:has-text("Load more"), button:has-text("Show more")')
          if (await loadMoreBtn.isVisible({ timeout: 3000 })) {
            await loadMoreBtn.click()
            await page.waitForTimeout(2000) // Wait for content to load
            loadMoreClicks++
          } else {
            break
          }
        } catch {
          break // No more "Load more" button
        }
      }

      // Extract opportunity cards
      const cards = await page.locator('.opportunity-card, [data-testid="opportunity-card"], .card').all()
      
      for (const card of cards) {
        try {
          const title = await card.locator('h3, .title, [data-testid="title"]').first().textContent() || ''
          const company = await card.locator('.organizer, .company-name, [data-testid="organizer"]').first().textContent() || 'Unknown'
          const link = await card.locator('a').first().getAttribute('href') || ''
          const fullUrl = link.startsWith('http') ? link : `https://unstop.com${link}`
          
          // Extract prize pool
          const prizeText = await card.locator('.prize, [data-testid="prize"]').first().textContent() || null
          
          // Extract deadline
          let deadline = null
          const deadlineText = await card.locator('.deadline, .date, [data-testid="deadline"]').first().textContent() || ''
          if (deadlineText) {
            // Parse date from "Ends on DD MMM YYYY" format
            const dateMatch = deadlineText.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
            if (dateMatch) {
              const [, day, month, year] = dateMatch
              deadline = new Date(`${day} ${month} ${year}`).toISOString().split('T')[0]
            }
          }
          
          // Extract team size
          const teamSizeText = await card.locator('.team-size, [data-testid="team-size"]').first().textContent() || null
          
          // Get full description by clicking into the card
          let description = ''
          let ppo_possible = false
          try {
            const detailPage = await context.newPage()
            await detailPage.goto(fullUrl, { timeout: 15000 })
            description = await detailPage.locator('.description, .about, [data-testid="description"]').first().textContent() || ''
            
            // Check for PPO indicators
            const descLower = description.toLowerCase()
            ppo_possible = descLower.includes('ppo') || 
                          descLower.includes('pre-placement') || 
                          descLower.includes('return offer') ||
                          descLower.includes('full-time opportunity')
            
            await detailPage.close()
          } catch (err) {
            console.log(`    Could not fetch details for ${title}`)
          }

          if (title && fullUrl) {
            opportunities.push({
              title: title.trim(),
              company: company.trim(),
              source: url.includes('hackathons') ? 'hackathon' : 'competition',
              url: fullUrl,
              description: description || `${title} organized by ${company}`,
              tags: [],
              deadline,
              stipend: null,
              location: null,
              is_remote: true, // Most Unstop events are online
              raw_html: null,
              category: url.includes('hackathons') ? 'hackathon' : 'competition',
              prize_pool: prizeText?.trim() || null,
              team_size: teamSizeText?.trim() || null,
              ppo_possible,
              registration_open: true,
              event_date: null
            })
          }
        } catch (err) {
          console.error('    Error parsing Unstop card:', err)
        }
      }
      
      await page.close()
    }
    
  } catch (error) {
    console.error('Unstop scraper error:', error)
  } finally {
    await browser.close()
  }
  
  return opportunities
}
