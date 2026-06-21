# Contributing to OpGrid

Thanks for your interest in contributing!

## Adding New Scrapers

1. Create a new file in `agent/src/scrapers/your-source.ts`
2. Export an async function returning `Opportunity[]`
3. Add to the scrapers list in `agent/src/scheduler/jobs.ts`

Example:

```typescript
import { Opportunity } from '../config/supabase'

export async function scrapeYourSource(): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []
  
  // Your scraping logic here
  
  return opportunities
}
```

## Scraping Best Practices

- Always set a User-Agent header
- Respect robots.txt
- Add delays between requests (rate limiting)
- Handle errors gracefully
- Store raw HTML for re-parsing if needed
- Use selectors that are likely to be stable

## Testing

Before submitting a PR:

1. Test your scraper locally
2. Verify data is correctly inserted into Supabase
3. Check that auto-tagging works
4. Ensure no duplicate entries are created

## Code Style

- Use TypeScript
- Follow existing patterns
- Add error handling
- Log meaningful messages

## Feature Requests

Open an issue describing:
- The feature you want
- Why it's useful
- How it should work

## Bug Reports

Include:
- Steps to reproduce
- Expected vs actual behavior
- Logs/error messages
- Environment details
