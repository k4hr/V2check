# ---------- base ----------
FROM node:20-slim AS base
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && rm -rf /var/lib/apt/lists/*

# ---------- deps ----------
FROM base AS deps
COPY package.json ./
COPY package-lock.json* ./
# Основные зависимости проекта
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi
# Библиотеки для парсинга (как у тебя)
RUN npm install --no-audit --no-fund jsdom sanitize-html @mozilla/readability

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Фиктивный DATABASE_URL только для prisma validate/generate (в рантайме будет свой)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Prisma: валидация и генерация клиента
RUN set -eux; \
  echo "== Prisma files =="; \
  ls -la prisma || true; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  npx prisma validate --schema=prisma/schema.prisma; \
  npx prisma generate --schema=prisma/schema.prisma

# Сборка Next.js
RUN npm run build

# ---------- runner ----------
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

RUN useradd -m -u 1001 nodeuser

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nodeuser
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# 1) Пробуем прогнать миграции (если они есть), иначе db push
# 2) Запускаем приложение ТОЛЬКО через npm (чтобы нашёлся next)
CMD ["sh","-c","\
  if [ -d prisma/migrations ] && [ \"$(ls -A prisma/migrations 2>/dev/null)\" ]; then \
    npx prisma migrate deploy; \
  else \
    npx prisma db push; \
  fi; \
  npm run start -s \
"]

# Некорневой пользователь
RUN useradd -m -u 1001 nodeuser

# Рантайм-артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# ВАЖНО: копируем prisma (для migrate deploy/db push)
COPY --from=builder /app/prisma ./prisma

USER nodeuser
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# Если есть миграции -> prisma migrate deploy, иначе fallback на db push
CMD ["sh","-c","if [ -d prisma/migrations ] && [ \"$(ls -A prisma/migrations 2>/dev/null)\" ]; then npx prisma migrate deploy; else npx prisma db push; fi; next start -p ${PORT:-3000}"]
