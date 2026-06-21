import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../../config/supabase'
import fellowships from '../../config/fellowships.json'

export async function scrapeFellowships(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  for (const fellowship of fellowships) {
    try {
      console.log(`    Scraping ${fellowship.name}...`)
      
      const response = await axios.get(fellowship.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      })
      
      const $ = cheerio.load(response.data)
      
      // Use the configured selector
      $(fellowship.selector).each((i, elem) => {
        try {
          const title = $(elem).find('h2, h3, .title, [class*="title"]').first().text().trim()
          const link = $(elem).find('a').first().attr('href') || ''
          let fullUrl = link
          
          // Handle relative URLs
          if (link && !link.startsWith('http')) {
            const baseUrl = new URL(fellowship.url)
            fullUrl = link.startsWith('/') 
              ? `${baseUrl.origin}${link}`
              : `${baseUrl.origin}/${link}`
          }
          
          if (title && fullUrl) {
            opportunities.push({
              title: `${fellowship.name}: ${title}`,
              company: fellowship.name,
              source: 'fellowship',
              url: fullUrl,
              description: fellowship.description,
              tags: ['fellowship', fellowship.cycle],
              deadline: null, // Will be updated by classifier
              stipend: null,
              location: 'Remote',
              is_remote: true,
              raw_html: $(elem).html(),
              category: 'fellowship',
              prize_pool: null,
              team_size: null,
              ppo_possible: true, // Fellowships often lead to opportunities
              registration_open: true,
              event_date: null
            })
          }
        } catch (err) {
          console.error(`      Error parsing ${fellowship.name} listing:`, err)
        }
      })
      
    } catch (error) {
      console.error(`    ${fellowship.name} scraper error:`, error)
    }
  }
  
  return opportunities
}
