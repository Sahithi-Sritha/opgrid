import { scrapeLinkedIn } from '../scrapers/linkedin'
import { scrapeWellfound } from '../scrapers/wellfound'
import { scrapeYCJobs } from '../scrapers/yc'
import { scrapeTelegram } from '../scrapers/telegram'
import { scrapeCareerPages } from '../scrapers/career-pages'
import { classifyOpportunity } from '../classifier/tagger'
import { supabase } from '../config/supabase'
import { notifyNewOpportunities } from '../notifier/telegram'
import { canonicalOpportunityUrl } from '../services/opportunity-identity'

// Export hackathon scrapers separately
export { runHackathonScrapers } from './hackathon-jobs'

export async function startScrapers() {
  console.log('🔍 Starting internship scrapers...')
  
  const scrapers = [
    { name: 'LinkedIn', fn: scrapeLinkedIn },
    { name: 'Wellfound', fn: scrapeWellfound },
    { name: 'YC Jobs', fn: scrapeYCJobs },
    { name: 'Telegram', fn: scrapeTelegram },
    { name: 'Career Pages', fn: scrapeCareerPages },
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
            } else if (error.code !== '23505') console.error(`    ✗ Insert failed for ${opp.url}:`, error.message)
          }
        }
      }
    } catch (error) {
      console.error(`  ✗ ${scraper.name} failed:`, error)
    }
  }

  console.log(`✅ Internship scraping complete. Found ${totalNew} new opportunities.`)
  
  if (totalNew > 0) {
    await notifyNewOpportunities(totalNew)
  }
}
