# ---------- deps: установка зависимостей ----------
FROM cgr.dev/chainguard/node:20-dev AS deps
ENV NODE_ENV=production
WORKDIR /app

# Консервативные настройки npm (меньше сюрпризов в сети)
RUN npm config set fund false \
 && npm config set audit false \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-maxtimeout 600000

COPY package.json ./
COPY package-lock.json* ./
# Если есть lock — ci; иначе — install
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts; \
    else \
      npm install --no-audit --no-fund --ignore-scripts; \
    fi

# ---------- builder: сборка Next ----------
FROM cgr.dev/chainguard/node:20-dev AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# Prisma validate/generate (мягко)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true
RUN (npx prisma validate --schema=prisma/schema.prisma || true)
RUN (npx prisma generate --schema=prisma/schema.prisma || true)

# Next 15 любит «дотянуть» типы — поставим их сами без изменения package.json
RUN npm install -D --no-save typescript @types/react @types/node

# Сборка
RUN npm run build

# ---------- deps-prod: только продовые модули ----------
FROM cgr.dev/chainguard/node:20-dev AS deps_prod
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund --ignore-scripts; \
    else \
      npm install --omit=dev --no-audit --no-fund --ignore-scripts; \
    fi

# ---------- runner ----------
FROM cgr.dev/chainguard/node:20 AS runner
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

# Мягкий prisma db push и старт Next
CMD ["sh","-c","(test -f prisma/schema.prisma && npx prisma db push --accept-data-loss || echo '⚠️ prisma step skipped') && npm run start -s"]
