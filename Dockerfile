# ---------- base ----------
FROM node:20-slim AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# на всякий случай: не пытаться авто-ставить типы во время билда
ENV NEXT_PRIVATE_SKIP_TYPECHECK=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini \
 && rm -rf /var/lib/apt/lists/*

# ---------- deps (FULL: dev+prod для сборки) ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
# полный install, чтобы typescript/@types были доступны на стадии сборки
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi

# ---------- builder (сборка Next + опционально бота) ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# Prisma: валидировать/генерировать, если схема существует
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN (test -f prisma/schema.prisma && npx prisma validate || true) \
 && (test -f prisma/schema.prisma && npx prisma generate || true)

# Сборка Next
RUN npm run build

# Компиляция бота, если есть tsconfig.bot.json (выход в dist-bot)
RUN if [ -f tsconfig.bot.json ]; then \
      npx tsc -p tsconfig.bot.json ; \
    else \
      echo "tsconfig.bot.json not found — skipping bot build"; \
    fi

# ---------- deps-prod (только prod для рантайма) ----------
FROM base AS deps_prod
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
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

# Артефакты сборки
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# Бот (если собирался)
COPY --from=builder /app/dist-bot ./dist-bot

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# 1) мягкий prisma db push (если схема есть)
# 2) старт бота, если есть dist-bot/start.js
# 3) старт Next
CMD ["sh","-lc","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo 'prisma skipped') \
 && (test -f dist-bot/start.js && node dist-bot/start.js & echo 'bot started' || echo 'bot missing, skipping') \
 && next start -H 0.0.0.0 -p ${PORT:-3000}"]
