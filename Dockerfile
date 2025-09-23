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

# фиктивный DATABASE_URL только для prisma validate/generate (реальный придёт на рантайме)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Prisma: валидация/генерация клиента
RUN set -eux; \
  echo "== Prisma files =="; \
  ls -la prisma || true; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  npx prisma validate --schema=prisma/schema.prisma; \
  npx prisma generate --schema=prisma/schema.prisma

# Сборка Next.js
RUN npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Копируем артефакты с правильными владельцами под уже существующего пользователя `node`
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
# нужны для migrate deploy / db push
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini","--"]
# На старте: если есть миграции — deploy, иначе db push; затем запускаем Next
CMD ["sh","-c","\
  if [ -d prisma/migrations ] && [ \"$(ls -A prisma/migrations 2>/dev/null)\" ]; then \
    npx prisma migrate deploy; \
  else \
    npx prisma db push; \
  fi; \
  npm run start -s \
"]
