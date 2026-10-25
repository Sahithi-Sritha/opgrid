import { scrapeFirecrawlOpportunities } from '../scrapers/hackathons/firecrawlScraper'
import { classifyOpportunity } from '../classifier/tagger'
import { supabase } from '../config/supabase'
import { notifyNewOpportunities } from '../notifier/telegram'
import { canonicalOpportunityUrl } from '../services/opportunity-identity'

export async function runHackathonScrapers() {
  console.log('🎯 Starting hackathon & fellowship scrapers...')
  
  const scrapers = [
    { name: 'Firecrawl discovery', fn: scrapeFirecrawlOpportunities }
  ]

  let totalNew = 0
  const maxCandidates = Math.max(1, Number.parseInt(process.env.MAX_NEW_OPPORTUNITIES_PER_RUN || '40', 10) || 40)

  for (const scraper of scrapers) {
    try {
      console.log(`  → Running ${scraper.name} scraper...`)
      const opportunities = await scraper.fn()
      
      for (const opp of opportunities.slice(0, maxCandidates)) {
        const url = canonicalOpportunityUrl(opp.url)
        // Check if already exists
        const { data: existing } = await supabase
          .from('opportunities')
          .select('id')
          .eq('url', url)
          .single()

        if (!existing) {
          // Classify and tag
          const classified = await classifyOpportunity({ ...opp, url })
          
          if (classified) {
            // Insert into database
            const { error } = await supabase
              .from('opportunities')
              .insert(classified)

            if (!error) {
              totalNew++
              console.log(`    ✓ New: ${opp.title} at ${opp.company}`)
            } else {
              console.error(`    ✗ Insert failed:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.error(`  ✗ ${scraper.name} failed:`, error)
    }
  }

  console.log(`✅ Hackathon scraping complete. Found ${totalNew} new opportunities.`)
  
  if (totalNew > 0) {
    await notifyNewOpportunities(totalNew)
  }
  
  return totalNew
}
