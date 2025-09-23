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
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi
RUN npm install --no-audit --no-fund jsdom sanitize-html @mozilla/readability

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# фиктивный URL только для prisma generate (в рантайме перекроется реальным)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# prisma: проверка и генерация клиента
RUN set -eux; \
  echo "== Prisma files =="; \
  ls -la prisma || true; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  npx prisma validate --schema=prisma/schema.prisma; \
  npx prisma generate --schema=prisma/schema.prisma

# сборка next
RUN npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Создаём пользователя, если его ещё нет
RUN id -u nodeuser >/dev/null 2>&1 || useradd -m -u 1001 nodeuser

# рантайм-артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# ВАЖНО: копируем папку с миграциями в рантайм
COPY --from=builder /app/prisma ./prisma

USER nodeuser
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# На старте: накатываем миграции и запускаем сервер
CMD ["sh","-c","npx prisma migrate deploy && npm run start -s"]
