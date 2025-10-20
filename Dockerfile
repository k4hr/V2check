# ---------- base ----------
FROM node:20-bookworm-slim AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && rm -rf /var/lib/apt/lists/*

# ---------- deps (полный набор для сборки) ----------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# lock есть -> ci, иначе обычный install
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# Prisma validate/generate (мягко, если Prisma отсутствует)
ENV DATABASE_URL="file:./dev.db"
RUN set -eux; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  (npx prisma validate --schema=prisma/schema.prisma || true); \
  (npx prisma generate --schema=prisma/schema.prisma || true)

# Сборка Next.js
RUN npm run build

# ---------- deps-prod (только продовые модули для рантайма) ----------
FROM base AS deps_prod
WORKDIR /app
COPY package*.json ./
# lock есть -> ci, иначе обычный install
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --omit=dev --no-audit --no-fund --ignore-scripts ; \
    fi

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Продовые node_modules
COPY --from=deps_prod /app/node_modules ./node_modules

# Рантайм-артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["sh","-c","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo '⚠️ prisma step skipped') && npm run start -s"]
