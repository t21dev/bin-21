# Self-Hosting Guide

Deploy your own instance of Bin 21 on your infrastructure.

## Prerequisites

- **Node.js 20+**
- **S3-compatible object storage** — stores paste content (Cloudflare R2, AWS S3, MinIO, Backblaze B2, etc.)
- **Persistent disk** — for the SQLite file holding paste metadata

No database or cache server is required. Paste metadata lives in a SQLite file; rate limiting is in-memory.

> **Single instance only.** SQLite plus in-memory rate limiting means you cannot run multiple replicas against one database file. If you need horizontal scaling, swap `lib/db/index.ts` for a networked database and `lib/rate-limit.ts` for a shared store.

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Database (optional)

```env
DATABASE_PATH=/data/bin21.db
```

Path to the SQLite file. Defaults to `./.data/bin21.db`. Point this at a **persistent** location — a container's ephemeral filesystem will lose every paste on restart. The file and its schema are created automatically on first boot (migrations run from `lib/db/index.ts`).

Back this file up. It is the only copy of your paste metadata. Because SQLite runs in WAL mode, copy it with `sqlite3 bin21.db ".backup out.db"` rather than `cp`, which can capture a torn write.

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

### Security (recommended)

```env
IP_HASH_SALT=generate-with-openssl-rand-hex-32
BOT_PROTECTION_ENABLED=true
```

Generate a salt with `openssl rand -hex 32`. Bot protection enables honeypot fields and time-based detection.

### Expired-paste janitor (recommended)

```env
JANITOR_ENABLED=true
```

Expired pastes always read as "not found", but something has to reclaim them. This starts an in-process sweep every 15 minutes that deletes expired rows **and their objects from your bucket**.

Set it only on the deployed instance. A development machine configured against your production bucket will happily reclaim live storage.

### Admin analytics (optional)

```env
ADMIN_TOKEN=generate-with-openssl-rand-hex-32
```

Enables a dashboard at `/admin` with paste/view totals, language mix, size distribution, and activity over time. Leave it unset and the route returns a genuine 404 — the page does not exist. Authentication is a single token compared with a fixed-length digest, stored in an httpOnly cookie; login attempts are throttled to 5 per 5 minutes per IP.

## Deployment Options

### Option 1: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
# better-sqlite3 is a native addon; alpine needs a toolchain to build it if no
# prebuilt binary matches the platform.
RUN apk add --no-cache python3 make g++ libc6-compat

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

Two things this image must keep, which a stock Next.js Dockerfile drops:

- **`lib/db/migrations`** — migrations are read from disk at boot. Without them the app cannot create its schema.
- **`node_modules`** — `output: 'standalone'` is deliberately not enabled, because tracing a native `.node` addon plus Shiki's runtime grammar loading into a standalone bundle is fragile. Railway bills memory and CPU, not image size, so the smaller bundle buys little here.

Build and run:

```bash
docker build -t bin21 .
docker run -p 3000:3000 -v bin21data:/data --env-file .env bin21
```

The `-v` is not optional. Without a volume the SQLite file lives in the container's writable layer and every paste is lost on restart.

### Option 2: Docker Compose

A single service plus a volume for the SQLite file:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_PATH: /data/bin21.db
      NEXT_PUBLIC_APP_URL: https://paste.example.com
      R2_ACCOUNT_ID: your-account-id
      R2_ACCESS_KEY_ID: your-access-key
      R2_SECRET_ACCESS_KEY: your-secret-key
      R2_BUCKET_NAME: bin21-pastes
      IP_HASH_SALT: change-me
      BOT_PROTECTION_ENABLED: "true"
      JANITOR_ENABLED: "true"
    volumes:
      - bin21data:/data

volumes:
  bin21data:
```

Start the stack:

```bash
docker compose up -d
```

No schema step is needed — migrations run on boot.

> Do not scale this service (`docker compose up --scale app=2`). Multiple instances writing one SQLite file over a shared volume will corrupt it, and each would keep its own rate-limit counters.

### Option 3: Manual (Node.js)

```bash
git clone https://github.com/t21dev/bin-21.git
cd bin-21
npm install
cp .env.example .env
# Edit .env with your configuration

npm run build      # Build for production
npm start          # Start on port 3000 (migrations run on boot)
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

Migrations in `lib/db/migrations` are applied automatically on boot, so a deploy needs no schema step.

- `npm run db:generate` — generate a SQL migration after editing `lib/db/schema.ts` (commit the result)
- `npm run db:push` — push the schema directly without a migration file (dev shortcut only)
- `npm run db:studio` — visual database browser for inspecting data

### Backups

The SQLite file is the only copy of your paste metadata. Back it up with SQLite's own API rather than a file copy — WAL mode means `cp` can capture a torn write:

```bash
sqlite3 /data/bin21.db ".backup /backups/bin21-$(date +%F).db"
```

On Railway, enable automated volume backups.

## Updating

```bash
git pull origin main
npm install
npm run build
# Restart your server / container (migrations apply on boot)
```

## Troubleshooting

- **Build fails with Shiki errors** — ensure `serverExternalPackages: ['shiki']` is in `next.config.ts`. Shiki uses WASM binaries that must be loaded at runtime.
- **R2/S3 connection errors** — verify your access key, secret key, and bucket name. Ensure the bucket exists and credentials have read/write permissions.
- **All pastes disappear on restart** — `DATABASE_PATH` is pointing at ephemeral storage. Mount a volume and point it there.
- **`no such table: pastes`** — the `lib/db/migrations` directory is missing from the deployed image. Migrations are read from disk at boot; copy that folder.
- **`SQLITE_CANTOPEN`** — the process cannot write to the directory holding `DATABASE_PATH`. Check the mount exists and is writable by the container user.
- **`SQLITE_BUSY` / database is locked** — more than one process is writing the file. Run exactly one instance; do not scale the service.
- **`invalid ELF header` / `NODE_MODULE_VERSION` mismatch on boot** — `better-sqlite3` is a native addon built for a specific platform and Node major version. Rebuild inside the target image (`npm rebuild better-sqlite3`) rather than copying `node_modules` across platforms.
- **Rate limiter not working** — if behind a reverse proxy, ensure `X-Forwarded-For` or `X-Real-IP` headers are passed. The rate limiter falls back to `127.0.0.1` when no client IP is detected.
- **`/admin` returns 404** — `ADMIN_TOKEN` is unset. That is the intended behaviour when it's not configured.
- **Expired pastes never disappear from storage** — `JANITOR_ENABLED` is not `true`. They already read as "not found"; the janitor is what reclaims the row and the object.
