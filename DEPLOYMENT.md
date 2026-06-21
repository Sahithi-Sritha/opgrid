# OpGrid deployment

The supported production deployment is a single Render Docker web service that hosts:

- the Next.js frontend;
- the Express API;
- the continuously running scraper scheduler.

See [DEPLOY_24_7.md](DEPLOY_24_7.md) for the current setup and required environment variables.

Local `.env` files and credentials must never be committed. Use `agent/.env.example` and
`frontend/.env.example` as templates, then store production values in Render's environment
variable settings.
