# OpGrid on Render

OpGrid deploys as one Render Docker web service:

- The Express API and scheduler stay alive in the main process.
- The exported Next.js frontend is served by the same service.
- Frontend API calls use the same origin, so no separate CORS URL is required.
- The Blueprint uses one `starter` instance and one replica.

## Deploy

1. Push this repository to a private GitHub repository.
2. In Render, choose **New → Blueprint**.
3. Select the repository and the root-level `render.yaml`.
4. Enter the requested secret environment variables.
5. Apply the Blueprint and wait for `/health` to pass.

Required values:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
```

Optional integrations can be left blank:

```text
APIFY_API_TOKEN
RESEND_API_KEY
DAILY_DIGEST_EMAIL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

## Why Starter is selected

Render's Free web services spin down after 15 minutes without inbound traffic. When that happens, the in-process scheduler stops. The Starter instance remains active, which is required for 24/7 scraping.

## Verify

Open:

```text
https://YOUR-SERVICE.onrender.com/health
```

Confirm:

```json
{
  "status": "ok",
  "scheduler": {
    "enabled": true
  }
}
```

Then open the service root URL to use the frontend.
