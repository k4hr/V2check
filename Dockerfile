# ---------- base ----------
FROM mirror.gcr.io/library/node:20-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && rm -rf /var/lib/apt/lists/*

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./

# Ставим все зависимости (включая dev), без скриптов
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

# Фиктивный DATABASE_URL только для валидации/генерации клиента Prisma
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Prisma: validate + generate (убираем BOM на всякий)
RUN set -eux; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  npx prisma validate --schema=prisma/schema.prisma; \
  npx prisma generate --schema=prisma/schema.prisma

# Сборка Next.js
RUN npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Важно для Next.js 15, чтобы слушал снаружи
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Создаём пользователя, но не падаем если он уже есть
RUN id -u nodeuser >/dev/null 2>&1 || useradd -m -u 1001 nodeuser || true

# Рантайм-артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Обязательно копируем prisma (чтобы в рантайме сделать db push)
COPY --from=builder /app/prisma ./prisma

# Оставляем root, чтобы npx prisma db push не упирался в права
# Если хочешь — раскомментируй следующую строку после первого успешного деплоя:
# USER nodeuser

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# В рантайме приводим БД к схеме (создаст таблицы cases/case_items и пр.)
# Если DATABASE_URL не задан или push упал — не валим контейнер.
CMD ["sh","-c","(npx prisma db push --accept-data-loss || echo '⚠️ prisma db push skipped/failed — продолжаем') && npm run start -s"]
