import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../../config/supabase'

export async function scrapeMLH(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  try {
    const response = await axios.get('https://mlh.io/seasons/2026/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // MLH lists events in a structured format
    $('.event, .event-wrapper, [class*="event"]').each((i, elem) => {
      try {
        const title = $(elem).find('h3, .event-name, [class*="name"]').first().text().trim()
        const link = $(elem).find('a').first().attr('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://mlh.io${link}`
        
        // Extract date
        const dateText = $(elem).find('.event-date, [class*="date"]').first().text()
        let event_date = null
        const dateMatch = dateText.match(/(\w+\s+\d{1,2})[,\s-]+(\d{4})/)
        if (dateMatch) {
          const [, dateStr, year] = dateMatch
          event_date = new Date(`${dateStr} ${year}`).toISOString().split('T')[0]
        }
        
        // Extract location
        const locationText = $(elem).find('.event-location, [class*="location"]').first().text().trim()
        const is_remote = locationText.toLowerCase().includes('online') || 
                         locationText.toLowerCase().includes('virtual')
        
        if (title && fullUrl) {
          opportunities.push({
            title,
            company: 'Major League Hacking',
            source: 'hackathon',
            url: fullUrl,
            description: `MLH event: ${title}`,
            tags: ['mlh'],
            deadline: null,
            stipend: null,
            location: locationText || null,
            is_remote,
            raw_html: $(elem).html(),
            category: 'hackathon',
            prize_pool: null,
            team_size: null,
            ppo_possible: false,
            registration_open: true,
            event_date
          })
        }
      } catch (err) {
        console.error('    Error parsing MLH event:', err)
      }
    })
    
  } catch (error) {
    console.error('MLH scraper error:', error)
  }
  
  return opportunities
}
