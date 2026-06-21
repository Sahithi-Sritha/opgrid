import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../../config/supabase'

export async function scrapeLabLab(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  try {
    const response = await axios.get('https://lablab.ai/event', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // LabLab uses event cards
    $('.event-card, [class*="event"]').each((i, elem) => {
      try {
        const title = $(elem).find('h2, h3, .title, [class*="title"]').first().text().trim()
        const link = $(elem).find('a').first().attr('href') || ''
        const fullUrl = link.startsWith('http') ? link : `https://lablab.ai${link}`
        
        // Extract dates
        const dateText = $(elem).find('.date, [class*="date"]').first().text()
        let event_date = null
        let deadline = null
        
        const dateMatch = dateText.match(/(\w+\s+\d{1,2})[,\s]+(\d{4})/)
        if (dateMatch) {
          const [, dateStr, year] = dateMatch
          event_date = new Date(`${dateStr} ${year}`).toISOString().split('T')[0]
        }
        
        // Extract prize
        const prizeText = $(elem).find('.prize, [class*="prize"]').first().text().trim() || null
        
        // Extract AI tools used
        const tools = $(elem).find('.tool, .technology, [class*="tech"]').map((i, el) => $(el).text().trim()).get()
        
        if (title && fullUrl) {
          opportunities.push({
            title,
            company: 'lablab.ai',
            source: 'hackathon',
            url: fullUrl,
            description: `AI Hackathon: ${title}`,
            tags: ['ai_hackathon', ...tools.slice(0, 3)], // Add AI tools as tags
            deadline,
            stipend: null,
            location: 'Online',
            is_remote: true,
            raw_html: $(elem).html(),
            category: 'hackathon',
            prize_pool: prizeText,
            team_size: null,
            ppo_possible: false,
            registration_open: true,
            event_date
          })
        }
      } catch (err) {
        console.error('    Error parsing LabLab card:', err)
      }
    })
    
  } catch (error) {
    console.error('LabLab scraper error:', error)
  }
  
  return opportunities
}
