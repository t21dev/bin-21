# Self-Hosting Guide

Deploy your own instance of Bin 21 on your infrastructure.

## Prerequisites

- **Node.js 20+**
- **PostgreSQL 16** — stores paste metadata (titles, expiry, view counts)
- **S3-compatible object storage** — stores paste content (Cloudflare R2, AWS S3, MinIO, Backblaze B2, etc.)
- **Redis** (optional) — powers rate limiting. Falls back to in-memory if unavailable

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Database (required)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bin21
```

Standard PostgreSQL connection string. The schema is managed by Drizzle ORM.

### Object Storage (required)

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=bin21-pastes
R2_PUBLIC_URL=https://your-public-url.com
```

Any S3-compatible storage works. The `R2_ACCOUNT_ID` constructs the endpoint as `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`. For other providers (AWS S3, MinIO, Backblaze B2), modify the endpoint in `server/services/storage.service.ts`.

### Application (required)

```env
NEXT_PUBLIC_APP_URL=https://paste.example.com
```

The public URL where your instance is accessible. Used for paste links and OpenGraph metadata.

### Redis (optional)

```env
REDIS_URL=redis://localhost:6379
```

Powers the sliding-window rate limiter. Without Redis, an in-memory fallback is used — works fine for single-instance deployments but doesn't share state across multiple instances.

### Security (recommended)

```env
IP_HASH_SALT=generate-with-openssl-rand-hex-32
BOT_PROTECTION_ENABLED=true
```

Generate a salt with `openssl rand -hex 32`. Bot protection enables honeypot fields and time-based detection.

## Deployment Options

### Option 1: Docker

Add `output: 'standalone'` to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['shiki'],
}
```

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t bin21 .
docker run -p 3000:3000 --env-file .env bin21
```

### Option 2: Docker Compose

Run Bin 21 with PostgreSQL and Redis in a single stack:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://bin21:bin21@db:5432/bin21
      REDIS_URL: redis://redis:6379
      NEXT_PUBLIC_APP_URL: https://paste.example.com
      R2_ACCOUNT_ID: your-account-id
      R2_ACCESS_KEY_ID: your-access-key
      R2_SECRET_ACCESS_KEY: your-secret-key
      R2_BUCKET_NAME: bin21-pastes
      IP_HASH_SALT: change-me
      BOT_PROTECTION_ENABLED: "true"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bin21
      POSTGRES_PASSWORD: bin21
      POSTGRES_DB: bin21
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bin21"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

Start the stack:

```bash
docker compose up -d
```

Then push the database schema:

```bash
# From the project directory (with node_modules installed)
DATABASE_URL=postgresql://bin21:bin21@localhost:5432/bin21 npm run db:push
```

### Option 3: Manual (Node.js)

```bash
git clone https://github.com/t21dev/bin-21.git
cd bin-21
npm install
cp .env.example .env
# Edit .env with your configuration

npm run db:push    # Initialize the database schema
npm run build      # Build for production
npm start          # Start on port 3000
```

Use pm2 to keep the app running:

```bash
npm install -g pm2
pm2 start npm --name bin21 -- start
pm2 save
pm2 startup
```

## Reverse Proxy

Put Bin 21 behind a reverse proxy for SSL termination. Minimal nginx config:

```nginx
server {
    listen 80;
    server_name paste.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name paste.example.com;

    ssl_certificate /etc/letsencrypt/live/paste.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/paste.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

The `X-Forwarded-For` and `X-Real-IP` headers are important — the rate limiter uses them to identify clients.

## Using MinIO Instead of Cloudflare R2

For fully self-contained storage, use [MinIO](https://min.io) as a drop-in S3-compatible replacement.

Add to your Docker Compose:

```yaml
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data
```

Then modify the S3 client in `server/services/storage.service.ts` to point to your MinIO instance and set `forcePathStyle: true` in the S3 client config.

## Database Management

- `npm run db:push` — apply current schema to the database (initial setup + after pulling schema changes)
- `npm run db:generate` — generate SQL migration files from schema changes
- `npm run db:studio` — visual database browser for inspecting data

## Updating

```bash
git pull origin main
npm install
npm run db:push    # Apply any schema changes
npm run build
# Restart your server / container
```

## Troubleshooting

- **Build fails with Shiki errors** — ensure `serverExternalPackages: ['shiki']` is in `next.config.ts`. Shiki uses WASM binaries that must be loaded at runtime.
- **R2/S3 connection errors** — verify your access key, secret key, and bucket name. Ensure the bucket exists and credentials have read/write permissions.
- **Database connection refused** — check that PostgreSQL is running and `DATABASE_URL` is correct. In Docker Compose, ensure the `db` service is healthy before the app starts.
- **Rate limiter not working** — if behind a reverse proxy, ensure `X-Forwarded-For` or `X-Real-IP` headers are passed. The rate limiter falls back to `127.0.0.1` when no client IP is detected.
- **Standalone output missing** — the Docker build requires `output: 'standalone'` in `next.config.ts`. Without it, `.next/standalone` won't be generated.
