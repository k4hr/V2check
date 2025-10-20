# syntax=docker/dockerfile:1.7

####################  base  ####################
# Ушли с ECR-зеркала на Docker Hub, более стабильно
ARG BASE_IMAGE=node:20-bookworm-slim
FROM ${BASE_IMAGE} AS base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Базовые утилиты + tini (graceful shutdown)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini \
 && rm -rf /var/lib/apt/lists/*

####################  deps (full)  ####################
FROM base AS deps
WORKDIR /app

# Только manifest'ы для детерминированной установки
COPY package.json ./
COPY package-lock.json* ./

# npm ci, если есть lock; иначе npm i
# Кэшируем артефакты npm, чтобы билды были быстрее
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi

####################  builder  ####################
FROM base AS builder
WORKDIR /app

# node_modules из deps
COPY --from=deps /app/node_modules ./node_modules
# исходники
COPY . .

# На всякий случай public
RUN mkdir -p public

# Prisma: валидируем/генерим мягко (если prisma есть)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN set -eux; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  (npx prisma validate --schema=prisma/schema.prisma || true); \
  (npx prisma generate --schema=prisma/schema.prisma || true)

# Сборка Next.js (используем общий NODE_ENV=production сверху)
RUN --mount=type=cache,target=/root/.npm \
    npm run build

####################  deps-prod (runtime deps only)  ####################
FROM base AS deps_prod
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --omit=dev --no-audit --no-fund --ignore-scripts ; \
    fi

####################  runner  ####################
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Продовые зависимости
COPY --from=deps_prod /app/node_modules ./node_modules

# Артефакты сборки
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Prisma-скhema (если есть) — не обязательно, но безвредно
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# Мягкий prisma push (если доступна БД) и старт Next
# Если push упадёт — не блокируем старт приложения.
CMD ["sh","-c","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo '⚠️ prisma step skipped') && npm run start -s"]
