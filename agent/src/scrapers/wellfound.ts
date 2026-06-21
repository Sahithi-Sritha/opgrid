import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../config/supabase'

export async function scrapeWellfound(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  try {
    // Wellfound (formerly AngelList) has a jobs API
    const url = 'https://wellfound.com/role/r/software-engineer-intern'
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Parse job listings
    $('.job-listing').each((i, elem) => {
      const title = $(elem).find('.job-title').text().trim()
      const company = $(elem).find('.company-name').text().trim()
      const url = $(elem).find('a').attr('href') || ''
      const location = $(elem).find('.location').text().trim()
      
      if (title && company && url) {
        opportunities.push({
          title,
          company,
          source: 'wellfound',
          url: url.startsWith('http') ? url : `https://wellfound.com${url}`,
          description: $(elem).find('.description').text().trim(),
          tags: [],
          deadline: null,
          stipend: null,
          location,
          is_remote: location.toLowerCase().includes('remote'),
          raw_html: $(elem).html()
        })
      }
    })
    
  } catch (error) {
    console.error('Wellfound scraper error:', error)
  }
  
  return opportunities
}
