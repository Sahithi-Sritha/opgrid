import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../../config/supabase'

export async function scrapeHackerEarth(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  try {
    const response = await axios.get('https://www.hackerearth.com/challenges/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // HackerEarth uses card-based layout
    $('.challenge-card, .challenge-list-item').each((i, elem) => {
      try {
        const title = $(elem).find('.challenge-name, .challenge-title, h3, h4').first().text().trim()
        const company = $(elem).find('.challenge-company, .sponsor, .organizer').first().text().trim() || 'HackerEarth'
        const link = $(elem).find('a').first().attr('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://www.hackerearth.com${link}`
        
        // Extract prize
        const prizeText = $(elem).find('.prize, .prize-amount').first().text().trim() || null
        
        // Extract deadline
        let deadline = null
        const deadlineText = $(elem).find('.deadline, .end-date, .remaining-time').first().text()
        if (deadlineText) {
          const dateMatch = deadlineText.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/)
          if (dateMatch) {
            const [, day, month, year] = dateMatch
            deadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
        }
        
        // Determine type
        const typeText = $(elem).find('.challenge-type, .type').first().text().toLowerCase()
        const isHackathon = typeText.includes('hackathon')
        const isHiring = typeText.includes('hiring') || typeText.includes('recruitment')
        
        // Category: hackathon if prize present, competition otherwise
        const category = prizeText ? 'hackathon' : 'competition'
        
        if (title && fullUrl) {
          opportunities.push({
            title,
            company,
            source: 'hackathon',
            url: fullUrl,
            description: `${title} on HackerEarth`,
            tags: isHiring ? ['hiring_challenge'] : [],
            deadline,
            stipend: null,
            location: null,
            is_remote: true,
            raw_html: $(elem).html(),
            category,
            prize_pool: prizeText,
            team_size: null,
            ppo_possible: isHiring,
            registration_open: true,
            event_date: null
          })
        }
      } catch (err) {
        console.error('    Error parsing HackerEarth card:', err)
      }
    })
    
  } catch (error) {
    console.error('HackerEarth scraper error:', error)
  }
  
  return opportunities
}
