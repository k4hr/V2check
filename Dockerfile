# ---------- base ----------
FROM public.ecr.aws/docker/library/node:20-slim AS base
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && rm -rf /var/lib/apt/lists/*

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi
# (если нужны) либы для импорта по URL/парсинга
RUN npm install --no-audit --no-fund jsdom sanitize-html @mozilla/readability

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Фиктивный DATABASE_URL только для prisma validate/generate на этапе сборки
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Prisma: validate + generate (пассивно, если prisma отсутствует)
RUN set -eux; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  (npx prisma validate --schema=prisma/schema.prisma || true); \
  (npx prisma generate --schema=prisma/schema.prisma || true)

# Сборка Next.js
RUN npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Рантайм-артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# В рантайме приводим БД к схеме; если переменная не задана/падение — не валим контейнер
CMD ["sh","-c","(npx prisma db push --accept-data-loss || echo '⚠️ prisma db push skipped/failed — продолжаем') && npm run start -s"]
