FROM node:22-alpine AS base
# ── Dependencies ─────────────────────────────────────────────
FROM base AS deps
# Повторы при transient DNS / dl-cdn.alpinelinux.org (сборка на PaaS).
RUN for i in 1 2 3 4 5; do \
      apk add --no-cache libc6-compat && break; \
      [ "$i" -eq 5 ] && exit 1; \
      echo "apk add libc6-compat failed (try $i/5), sleep 12s"; \
      sleep 12; \
    done
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}

# Увеличенный таймаут и повторы при нестабильной сети (EOF при npm ci на хостинге).
# Если ошибка повторяется — раскомментировать зеркало: npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm ci --ignore-scripts --fetch-timeout=120000
RUN npm rebuild sharp
RUN npx prisma generate

# ── Build ────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib/generated ./lib/generated
COPY . .

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* вшиваются в бандл при сборке — передать через --build-arg при docker build
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_YM_ID
ENV NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID}
ENV NEXT_PUBLIC_YM_ID=${NEXT_PUBLIC_YM_ID}

# Увеличить лимит памяти Node при сборке (100+ SSG страниц), иначе билд может «висеть» или падать по OOM
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# ── Production ───────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/lib/generated ./lib/generated

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
