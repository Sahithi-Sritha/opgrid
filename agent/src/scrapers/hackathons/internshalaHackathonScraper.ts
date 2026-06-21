import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../../config/supabase'

export async function scrapeInternshalaHackathons(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  try {
    const response = await axios.get('https://internshala.com/hackathons/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Internshala uses card-based layout
    $('.hackathon_card, .card, [class*="hackathon"]').each((i, elem) => {
      try {
        const title = $(elem).find('.title, h3, h4, [class*="title"]').first().text().trim()
        const company = $(elem).find('.company, [class*="company"]').first().text().trim() || 'Internshala'
        const link = $(elem).find('a').first().attr('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://internshala.com${link}`
        
        // Extract prize
        const prizeText = $(elem).find('.prize, [class*="prize"]').first().text().trim() || null
        
        // Extract deadline
        let deadline = null
        const deadlineText = $(elem).find('.deadline, [class*="deadline"]').first().text()
        if (deadlineText) {
          const dateMatch = deadlineText.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/)
          if (dateMatch) {
            const [, day, month, year] = dateMatch
            deadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
        }
        
        if (title && fullUrl) {
          opportunities.push({
            title,
            company,
            source: 'hackathon',
            url: fullUrl,
            description: `${title} hackathon`,
            tags: [],
            deadline,
            stipend: null,
            location: null,
            is_remote: true,
            raw_html: $(elem).html(),
            category: 'hackathon',
            prize_pool: prizeText,
            team_size: null,
            ppo_possible: false,
            registration_open: true,
            event_date: null
          })
        }
      } catch (err) {
        console.error('    Error parsing Internshala hackathon:', err)
      }
    })
    
  } catch (error) {
    console.error('Internshala hackathon scraper error:', error)
  }
  
  return opportunities
}
