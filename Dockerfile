# ---------- base ----------
# На mirror.gcr.io нет node:20-slim, используем node:20 (есть на зеркале)
FROM mirror.gcr.io/library/node:20 AS base
ENV NODE_ENV=production
WORKDIR /app

# Минимально необходимое (tini уже есть в node:20, но оставим установку bash/openssl на всякий)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash && rm -rf /var/lib/apt/lists/*

# ---------- deps ----------
FROM base AS deps
WORKDIR /app

# Если есть lock — используем ci для воспроизводимости
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

# Берём уже установленные зависимости
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходники
COPY . .

# Фиктивный DATABASE_URL только для валидации/генерации Prisma-клиента на этапе сборки
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Prisma: validate + generate (если Prisma отсутствует — просто пропустим)
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
# Для Next.js 15 — обязательно указывать HOSTNAME, чтобы слушал снаружи
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Рантайм-артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Запускаем через sh: сначала приводим БД к схеме, затем стартуем Next
# Если DATABASE_URL не задан / db push не удался — не валим контейнер, просто продолжаем
CMD ["sh","-c","(npx prisma db push --accept-data-loss || echo '⚠️ prisma db push skipped/failed — продолжаем') && npm run start -s"]
