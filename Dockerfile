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
# либы для importByUrl
RUN npm install --no-audit --no-fund jsdom sanitize-html @mozilla/readability

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# фиктивный URL только для генерации клиента
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# prisma: validate + generate
RUN set -eux; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  npx prisma validate --schema=prisma/schema.prisma; \
  npx prisma generate --schema=prisma/schema.prisma

# build next
RUN npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# важно: чтобы Next слушал извне
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# (опционально) создать пользователя, но без падения если уже есть
RUN id -u nodeuser >/dev/null 2>&1 || useradd -m -u 1001 nodeuser || true

# рантайм артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# обязательно копируем миграции/схему
COPY --from=builder /app/prisma ./prisma

# можно остаться root, чтобы npx не упёрся в права
# USER nodeuser

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# выполняем миграции, но НЕ валим контейнер, если что-то не так
CMD ["sh","-c","(npx prisma migrate deploy || echo '⚠️ prisma migrate failed — продолжаем') && npm run start -s"]
