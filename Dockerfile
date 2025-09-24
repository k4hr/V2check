# ---------- base ----------
# Можно переопределить на build-е:
#   NODE_REG=node  NODE_TAG=20-slim   (чтобы тянуть с docker.io)
ARG NODE_REG="mirror.gcr.io/library/node"
ARG NODE_TAG="20-slim"

FROM ${NODE_REG}:${NODE_TAG} AS base
ENV NODE_ENV=production
WORKDIR /app

# базовый набор утилит + tini
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && \
    rm -rf /var/lib/apt/lists/*

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./

# Ставим зависимости (включая dev), без postinstall-скриптов
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

# Prisma validate + generate (если prisma отсутствует — не падаем)
# DATABASE_URL нужен только для генерации клиента на этапе сборки
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

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
# Для Next.js 15
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

# В рантайме применяем схему БД (если DATABASE_URL не задан — пропускаем)
CMD ["sh","-c","(npx prisma db push --accept-data-loss || echo '⚠️ prisma db push skipped/failed — продолжаем') && npm run start -s"]
