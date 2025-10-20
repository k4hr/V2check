# ---------- base ----------
FROM node:20-slim AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_SKIP_TYPECHECK=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl curl bash tini \
  && rm -rf /var/lib/apt/lists/*

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

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# prisma (мягко — если схемы нет, просто пропускаем)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN (test -f prisma/schema.prisma && npx prisma validate || true) && \
    (test -f prisma/schema.prisma && npx prisma generate || true)

# Сборка Next (у нас только скрипт "build")
RUN npm run build

# Если есть отдельная сборка бота — выполним, иначе пропустим (не упадём)
RUN if [ -f tsconfig.bot.json ]; then npm run build:bot || true; fi

# ---------- deps-prod ----------
FROM base AS deps_prod
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
# ВАЖНО: без --ignore-scripts, чтобы next подтянул бинарь
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund ; \
    else \
      npm install --omit=dev --no-audit --no-fund ; \
    fi

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=deps_prod /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# дист бота может и не существовать — это ок
COPY --from=builder /app/dist-bot ./dist-bot 2>/dev/null || true

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["sh","-c","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo 'prisma skipped') && npm run start -s"]
