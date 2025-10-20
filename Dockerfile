# ---------- base ----------
FROM node:20-slim AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_SKIP_TYPECHECK=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && rm -rf /var/lib/apt/lists/*

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund ; \
    else \
      npm install --no-audit --no-fund ; \
    fi

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# Prisma мягко (если есть схема)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN (test -f prisma/schema.prisma && npx prisma validate || true) \
 && (test -f prisma/schema.prisma && npx prisma generate || true)

# Сборка веба и бота
RUN npm run build:web
RUN npm run build:bot || true   # если бота нет — не падать

# ---------- deps-prod ----------
FROM base AS deps_prod
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
# ВАЖНО: НЕ используем --ignore-scripts, чтобы next подтянул всё нужное
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

# node_modules прод-слоя
COPY --from=deps_prod /app/node_modules ./node_modules

# артефакты рантайма
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist-bot ./dist-bot

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# 1) мягкий prisma db push
# 2) стартуем бота в фоне
# 3) стартуем веб ЧЕРЕЗ npm (или через точный путь в скрипте)
CMD ["sh","-lc","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo 'prisma skipped'); node dist-bot/index.js & exec npm run start -s"]
