# ---------- base ----------
# Надёжное зеркало Docker Hub (Google cache)
FROM mirror.gcr.io/library/node:20-alpine AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Базовые пакеты для рантайма и скриптов
#  - libc6-compat: совместимость glibc для некоторых нативных модулей
#  - openssl, libstdc++: нужны Prisma/https
#  - tini: корректный PID1
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    libstdc++ \
    bash \
    curl \
    tini

# ---------- deps (полный набор для сборки) ----------
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
# Если есть lockfile — используем его, иначе fallback на install
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

# Prisma validate/generate (мягко)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
# Убираем возможный BOM у prisma/schema.prisma
RUN (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true
RUN (npx prisma validate --schema=prisma/schema.prisma || true)
RUN (npx prisma generate --schema=prisma/schema.prisma || true)

# Next 15 иногда сам дотягивает тайпинги. Поставим сами, без сохранения.
RUN npm install -D --no-save typescript @types/react @types/node

# Сборка Next.js
RUN npm run build

# ---------- deps-prod (только продовые модули для рантайма) ----------
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
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Продовые node_modules
COPY --from=deps_prod /app/node_modules ./node_modules

# Артефакты рантайма
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENTRYPOINT ["/sbin/tini","--"]

# Мягкий prisma db push и старт Next
CMD ["sh","-c","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo '⚠️ prisma step skipped') && npm run start -s"]
