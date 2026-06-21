# OpGrid free deployment

OpGrid uses two free services:

- **Render Free web service** hosts the frontend and API.
- **GitHub Actions** runs the agent schedule independently.

The Render service can sleep after 15 minutes without traffic. Opening the site wakes it in
about a minute. Scraping does not depend on the Render process: GitHub Actions runs it directly
against Supabase every six hours.

## Render

The root `render.yaml` creates one free Docker web service. Required values:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
```

Optional integrations:

```text
APIFY_API_TOKEN
RESEND_API_KEY
DAILY_DIGEST_EMAIL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

The in-process scheduler is intentionally disabled on Render because free services sleep.

## GitHub Actions secrets

Add the following repository secrets under **Settings → Secrets and variables → Actions**:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
GEMINI_API_KEY
APIFY_API_TOKEN
RESEND_API_KEY
DAILY_DIGEST_EMAIL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

The workflow at `.github/workflows/opgrid-schedule.yml` runs:

- scraping every six hours;
- deadline checks daily at 08:00 IST;
- digest daily at 09:00 IST;
- follow-ups daily at 10:00 IST.

The workflow can also be started manually from the GitHub Actions tab.

## Free-tier caveats

- Render's first page load after sleeping can take about one minute.
- GitHub Free includes 2,000 Actions minutes per month for private repositories.
- Render can suspend a free service that initiates unusually high outbound traffic.
- This is autonomous and free, but it does not provide an always-responsive production SLA.
