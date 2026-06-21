import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../config/supabase'

export async function scrapeYCJobs(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  try {
    const url = 'https://www.ycombinator.com/jobs'
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // YC has a structured job board
    $('[data-job-id]').each((i, elem) => {
      const title = $(elem).find('[data-job-title]').text().trim()
      const company = $(elem).find('[data-company-name]').text().trim()
      const url = $(elem).find('a').attr('href') || ''
      const location = $(elem).find('[data-location]').text().trim()
      
      // Filter for internships
      if (title.toLowerCase().includes('intern')) {
        opportunities.push({
          title,
          company,
          source: 'yc',
          url: url.startsWith('http') ? url : `https://www.ycombinator.com${url}`,
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
    console.error('YC Jobs scraper error:', error)
  }
  
  return opportunities
}
