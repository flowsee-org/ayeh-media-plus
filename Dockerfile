# syntax=docker/dockerfile:1.7
#
# Ayeh Media Plus — multi-target production images
#   docker build --target api -t ayeh-api:local .
#   docker build --target web -t ayeh-web:local .
#
# Do not copy .env / secrets into layers. Runtime config via Compose/env files.
# Base uses full bookworm (not slim) so openssl/ca-certificates are present
# without an apt-get round-trip (apt mirrors have been flaky in some environments).
# ffmpeg/ffprobe are copied from a static binary image (no apt required).

ARG NODE_VERSION=22

# ─── Base: Node LTS + pnpm ───────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app

# ─── Dependencies (full, for generate + Next build) ──────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc* ./

RUN pnpm install --frozen-lockfile

# ─── Build: PG Prisma client + Next standalone ───────────────────────────────
FROM deps AS build

COPY . .

# Production containers must ship the PostgreSQL-generated Prisma Client.
# (Shared @prisma/client output — last generate wins.)
RUN pnpm db:generate:pg

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# ─── API runtime (Express + Socket.io + uploads + ffmpeg) ────────────────────
FROM base AS api

# Static ffmpeg/ffprobe — avoids apt-get in restricted networks.
COPY --from=mwader/static-ffmpeg:7.1.1 /ffmpeg /usr/local/bin/ffmpeg
COPY --from=mwader/static-ffmpeg:7.1.1 /ffprobe /usr/local/bin/ffprobe

ENV NODE_ENV=production
ENV PORT=5000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/scripts ./scripts

# Repo-root uploads directory (multer + express.static). Persist via volume.
RUN mkdir -p /app/uploads \
  && chown -R node:node /app

USER node
WORKDIR /app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(async r=>{const j=await r.json().catch(()=>({})); process.exit(r.ok&&j.database==='ok'?0:1)}).catch(()=>process.exit(1))"

# Migrations are NOT automatic — use scripts/migrate-deploy.sh or compose migrate profile.
CMD ["node", "server/index.js"]

# ─── Web runtime (Next.js standalone) ────────────────────────────────────────
FROM base AS web

ENV NODE_ENV=production
ENV PORT=5173
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone server traces minimal deps; static + public must sit beside it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Defense in depth: never ship local env files if Next copied them into standalone.
USER root
RUN rm -f .env .env.* \
  && mkdir -p .next/static public \
  && chown -R node:node /app

USER node
WORKDIR /app

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5173)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
