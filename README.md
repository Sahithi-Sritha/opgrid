# OpGrid

OpGrid is a student-focused opportunity dashboard for finding public internship, hackathon, fellowship, and competition listings, then saving and tracking applications. It is an early beta: listings are collected from public sources and should always be verified at the original URL.

## What works today

- Supabase email/password registration, sign-in, session restoration, sign-out, and password-reset email.
- A responsive feed, deadline dashboard, saved listings, and application tracker.
- Source-specific scrapers plus Firecrawl discovery for public opportunity pages, with canonical-URL deduplication.
- Per-user records protected with Supabase RLS: applications, resumes, analyses, notifications, saved listings, custom sources, and seen state.
- Optional email/Telegram notifications and an optional resume/JD keyword-analysis workflow.

## Important limits

- OpGrid does not confirm a student's eligibility. It preserves the source URL and does not treat a match as a guarantee.
- Discovery and classification can fail due to source changes, access controls, rate limits, or model/provider limits.
- Resume scoring is experimental and is not an ATS prediction or hiring recommendation.
- The resume UI includes prototype elements; do not enable resume uploads in a public beta until the storage policy and retention plan are reviewed.

## Architecture

```
Next.js browser UI ── bearer token ──> Express API ──> Supabase Postgres/Auth/Storage
                                         │
                                  scheduled source scrapers
                                         │
                              optional Gemini or Bedrock classifier
```

The Express API verifies every browser token. User requests use an RLS-bound Supabase client; the service-role client is reserved for trusted jobs.

## Local setup

Prerequisites: Node 22, a Supabase project, and optionally Gemini, AWS Bedrock, Resend, Apify, or Telegram credentials.

```bash
cp frontend/.env.example frontend/.env.local
cp agent/.env.example agent/.env
cd frontend && npm ci
cd ../agent && npm ci
```

1. In Supabase Auth, enable Email/Password and add `http://localhost:3000/auth/sign-in` to redirect URLs.
2. Run [schema.sql](schema.sql), [schema-migration-resume-engine.sql](schema-migration-resume-engine.sql), [schema-migration-auth-rls.sql](schema-migration-auth-rls.sql), then [schema-migration-resume-security.sql](schema-migration-resume-security.sql) in the Supabase SQL editor.
3. Set the values described in the two example environment files. `SUPABASE_SERVICE_KEY`, `INTERNAL_JOB_SECRET`, provider tokens, and GitHub PATs belong only in `agent/.env` or server hosting settings.
4. Run `npm run dev` in `frontend/` and `agent/` separately.

## Validation

```bash
cd agent
npm run build
npm run test:identity

cd ../frontend
npx tsc --noEmit
npm run build
```

The legacy `frontend` `npm run lint` command is not compatible with Next 16; run `npx eslint app components lib` until that script is updated.

## Discovery cost guardrails

The defaults run source scraping every six hours and Firecrawl discovery twice daily. Firecrawl is capped at five scraped search results per run; the deterministic deduplicator does not call an LLM. Startup discovery is off by default so a process restart cannot consume credits. For a 10–20 tester beta, monitor failures and credit consumption before increasing either cap or frequency.

Firecrawl discovery uses one targeted search plus five scraped results per run. At two runs/day, its expected usage is roughly 420 credits/month (about two search credits plus five page credits per run), under its current 1,000-credit free tier. Keep `FIRECRAWL_SEARCH_LIMIT` at five until actual usage has been measured.

HackerAgentRank was also evaluated but is not integrated. It is a separate FastAPI/Next.js/local-model system and would add disproportionate deployment and privacy complexity. Its own disclaimer says it is not an ATS or hiring decision system.

## Deployment and beta checklist

Use the existing Docker/Render configuration, or deploy the frontend and API separately. Configure all server secrets in the host; never commit them. Apply RLS before inviting users, create two test accounts, and verify that each cannot read or update the other's records.

For the first beta cohort, invite 10–20 students, explain that results are public listings rather than eligibility guarantees, and provide the issue template for problems. Keep `ENABLE_SCHEDULER=false` on the free Render service and use the included GitHub Actions schedule only after storing its required secrets.

### Resume Studio configuration

The Resume Studio stores named LaTeX sources and versions under the authenticated user. HackerAgentRank feedback is optional and requires a private deployment of its FastAPI service plus `HACKER_AGENT_RANK_URL` (and, if enabled there, `HACKER_AGENT_RANK_API_KEY`) in the agent environment. Its upstream API is localhost-oriented; do not expose it directly to browsers.

PDF compilation is intentionally disabled in this deployment until a resource-limited sandbox service is provided. Do not enable the legacy in-process `pdflatex` compiler for untrusted user LaTeX. The Studio therefore supports source editing, safe persistence, version lineage, and feedback today, but not compiled-PDF download yet.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Do not add a scraper without respecting the source's terms, robots guidance, and rate limits. Do not add secrets, resumes, personal data, or generated output to a pull request.

## License

[MIT](LICENSE). Confirm that all contributors have the right to submit their code before accepting external contributions.
