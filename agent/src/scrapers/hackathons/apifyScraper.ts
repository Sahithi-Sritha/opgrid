import { ApifyClient } from 'apify-client';
import { Opportunity } from '../../config/supabase';

export async function scrapeApifyHackathons(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];
  
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error('APIFY_API_TOKEN is missing. Cannot run Apify scraper.');
    return [];
  }

  const client = new ApifyClient({ token });

  try {
    console.log('    Calling Apify google-search-scraper...');
    
    // Default targeted queries
    const queryList = [
      `"internship" "computer science" "india" site:unstop.com`,
      `"hackathon" "india" site:devfolio.co`,
      `"software engineering intern" "india" site:unstop.com`,
      `"sde intern" "india" site:hackerearth.com`
    ];
    
    const run = await client.actor("apify/google-search-scraper").call({
      queries: queryList.join('\n'),
      maxPagesPerQuery: 1,
      resultsPerPage: 5
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items.length > 0 && items[0].organicResults) {
      const results = items[0].organicResults as any[];
      
      for (const result of results) {
        // Extract info from search result snippet
        const title = result.title || '';
        const url = result.url || '';
        const snippet = result.description || '';
        
        let company = 'Unknown';
        if (url.includes('devfolio.co')) company = 'Devfolio';
        else if (url.includes('unstop.com')) company = 'Unstop';
        else if (url.includes('mlh.io')) company = 'MLH';
        else if (url.includes('hackerearth.com')) company = 'HackerEarth';

        if (title && url && (url.includes('/hackathon') || url.includes('/seasons') || url.includes('/competitions'))) {
          opportunities.push({
            title: title.replace(/(\|.*|-.*)/g, '').trim(), // Clean up title
            company,
            source: 'hackathon',
            url,
            description: snippet,
            tags: [],
            deadline: null,
            stipend: null,
            location: 'Online',
            is_remote: true,
            raw_html: null,
            category: 'hackathon',
            prize_pool: null,
            team_size: null,
            ppo_possible: false,
            registration_open: true,
            event_date: null
          });
        }
      }
    }
  } catch (error) {
    console.error('    Apify scraper error:', error);
  }

  return opportunities;
}
