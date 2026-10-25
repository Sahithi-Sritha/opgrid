import { Opportunity } from '../../config/supabase'

type FirecrawlResult = {
  url?: string
  title?: string
  description?: string
  markdown?: string
  metadata?: { title?: string; description?: string }
}

const query = 'active computer science internships hackathons fellowships India 2026 site:unstop.com OR site:devfolio.co OR site:hackerearth.com'

function companyFromUrl(url: string) {
  if (url.includes('devfolio.co')) return 'Devfolio'
  if (url.includes('unstop.com')) return 'Unstop'
  if (url.includes('hackerearth.com')) return 'HackerEarth'
  return new URL(url).hostname.replace(/^www\./, '')
}

export async function scrapeFirecrawlOpportunities(): Promise<Opportunity[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('    FIRECRAWL_API_KEY is missing. Skipping Firecrawl discovery.')
    return []
  }

  const limit = Math.min(Math.max(Number.parseInt(process.env.FIRECRAWL_SEARCH_LIMIT || '5', 10) || 5, 1), 10)
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        limit,
        sources: [{ type: 'web' }],
        scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
      }),
      signal: AbortSignal.timeout(45_000),
    })
    if (!response.ok) {
      console.error(`    Firecrawl search returned HTTP ${response.status}`)
      return []
    }

    const payload = await response.json() as { data?: FirecrawlResult[] | { web?: FirecrawlResult[] } }
    const results = Array.isArray(payload.data) ? payload.data : payload.data?.web || []
    return results.flatMap((result) => {
      const url = result.url
      const title = result.title || result.metadata?.title
      if (!url || !title) return []
      const description = (result.markdown || result.description || result.metadata?.description || '').slice(0, 12_000)
      return [{
        title: title.replace(/\s*[|–-]\s*(Unstop|Devfolio|HackerEarth).*$/i, '').trim(),
        company: companyFromUrl(url),
        source: 'hackathon',
        url,
        description,
        tags: [],
        deadline: null,
        stipend: null,
        location: 'Online',
        is_remote: true,
        raw_html: null,
        category: /fellowship/i.test(`${title} ${description}`) ? 'fellowship' : 'hackathon',
        prize_pool: null,
        team_size: null,
        ppo_possible: false,
        registration_open: true,
        event_date: null,
      }]
    })
  } catch (error) {
    console.error('    Firecrawl discovery failed:', error instanceof Error ? error.message : 'unknown error')
    return []
  }
}
