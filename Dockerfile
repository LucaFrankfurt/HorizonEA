# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# HorizonEA – multi-stage production image (Next.js standalone output)
# ---------------------------------------------------------------------------
ARG NODE_IMAGE=node:22-alpine

# 1) Install dependencies (cached as long as the lockfile does not change)
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# 2) Build the application
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ARG NEXT_PUBLIC_CURRENCY=EUR
ENV NEXT_PUBLIC_CURRENCY=${NEXT_PUBLIC_CURRENCY} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Minimal runtime image
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PGLITE_DATA_DIR=/app/data/pglite

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
 && mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# SQL migrations are applied automatically on start-up
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
# Only used when running without DATABASE_URL (embedded PGlite mode)
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

CMD ["node", "server.js"]
