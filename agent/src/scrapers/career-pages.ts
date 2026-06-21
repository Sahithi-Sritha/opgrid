import axios from 'axios'
import * as cheerio from 'cheerio'
import { Opportunity } from '../config/supabase'

// List of company career pages to monitor
const CAREER_PAGES = [
  {
    name: 'Stripe',
    url: 'https://stripe.com/jobs/search?job_level=Intern',
  },
  {
    name: 'Airbnb',
    url: 'https://careers.airbnb.com/positions/?category=Internships',
  },
  {
    name: 'Figma',
    url: 'https://www.figma.com/careers/#job-postings',
  },
  // Add more companies
]

export async function scrapeCareerPages(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  const pagesToScrape = [...CAREER_PAGES]

  try {
    const response = await fetch('http://localhost:3001/api/sources')
    const data = await response.json() as any
    if (data.sources && Array.isArray(data.sources)) {
      for (const url of data.sources) {
        // Ensure valid URL
        const fullUrl = url.startsWith('http') ? url : `https://${url}`
        pagesToScrape.push({ name: new URL(fullUrl).hostname, url: fullUrl })
      }
    }
  } catch (error) {
    console.log('    Could not fetch custom sources for career pages.')
  }

  for (const page of pagesToScrape) {
    try {
      const response = await axios.get(page.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      const $ = cheerio.load(response.data)
      
      // Each company has different HTML structure
      // This is a generic parser - customize per company
      $('a[href*="job"], a[href*="position"], a[href*="career"]').each((i, elem) => {
        const text = $(elem).text().toLowerCase()
        
        if (text.includes('intern') || text.includes('internship')) {
          const title = $(elem).text().trim()
          const url = $(elem).attr('href') || ''
          
          opportunities.push({
            title,
            company: page.name,
            source: 'career_page',
            url: url.startsWith('http') ? url : `${new URL(page.url).origin}${url}`,
            description: null,
            tags: [],
            deadline: null,
            stipend: null,
            location: null,
            is_remote: false,
            raw_html: $(elem).html()
          })
        }
      })
      
    } catch (error) {
      console.error(`Career page scraper error (${page.name}):`, error)
    }
  }
  
  return opportunities
}
