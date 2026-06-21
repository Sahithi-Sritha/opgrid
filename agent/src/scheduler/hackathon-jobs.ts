import { scrapeApifyHackathons } from '../scrapers/hackathons/apifyScraper'
import { classifyOpportunity } from '../classifier/tagger'
import { supabase } from '../config/supabase'
import { notifyNewOpportunities } from '../notifier/telegram'

export async function runHackathonScrapers() {
  console.log('🎯 Starting hackathon & fellowship scrapers...')
  
  const scrapers = [
    { name: 'Apify Google Search', fn: scrapeApifyHackathons }
  ]

  let totalNew = 0

  for (const scraper of scrapers) {
    try {
      console.log(`  → Running ${scraper.name} scraper...`)
      const opportunities = await scraper.fn()
      
      for (const opp of opportunities) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('opportunities')
          .select('id')
          .eq('url', opp.url)
          .single()

        if (!existing) {
          // Classify and tag
          const classified = await classifyOpportunity(opp)
          
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
