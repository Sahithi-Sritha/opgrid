FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npx playwright install --with-deps chromium

COPY --from=build /app/dist ./dist
COPY custom_sources.json ./custom_sources.json

RUN mkdir -p /tmp/uploads

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
