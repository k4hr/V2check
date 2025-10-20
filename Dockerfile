# ---------- base ----------
# Уходим с Docker Hub на стабильный ECR-миррор Debian
FROM public.ecr.aws/debian/debian:bookworm-slim AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# На всякий выключим автоскачивание corepack/yarn
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

# Базовые утилиты + tini; без лишнего мусора
RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends ca-certificates curl gnupg bash tini openssl; \
  rm -rf /var/lib/apt/lists/*

# Ставим Node.js 20 из NodeSource (чтобы не зависеть от docker.io/library/node)
RUN set -eux; \
  arch="$(dpkg --print-architecture)"; \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /usr/share/keyrings/nodesource.gpg; \
  echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list; \
  apt-get update; \
  apt-get install -y --no-install-recommends nodejs; \
  node -v && npm -v; \
  npm config set fund false && npm config set audit false && npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retries 5; \
  rm -rf /var/lib/apt/lists/*

# ---------- deps (полный набор для сборки) ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
# Если есть lock — ci, иначе install
RUN set -eux; \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund --ignore-scripts; \
  else \
    npm install --no-audit --no-fund --ignore-scripts; \
  fi

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# На всякий случай public существует
RUN mkdir -p public

# Prisma validate/generate (мягко, если Prisma нет)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN set -eux; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  (npx prisma validate --schema=prisma/schema.prisma || true); \
  (npx prisma generate --schema=prisma/schema.prisma || true)

# ВАЖНО: у тебя Next во время build пытался «сам» поставить types через yarn.
# Чтобы не было сетевых сюрпризов и yarn, ставим dev-типы сами, и без изменения package.json:
RUN set -eux; \
  npm install -D --no-save typescript @types/react @types/node

# Сборка Next.js
RUN npm run build

# ---------- deps-prod (только продовые модули) ----------
FROM base AS deps_prod
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then \
    npm ci --omit=dev --no-audit --no-fund --ignore-scripts; \
  else \
    npm install --omit=dev --no-audit --no-fund --ignore-scripts; \
  fi

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Продовые node_modules (без dev)
COPY --from=deps_prod /app/node_modules ./node_modules

# Артефакты рантайма
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# Мягкий prisma db push и старт
CMD ["sh","-c","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo '⚠️ prisma step skipped') && npm run start -s"]
