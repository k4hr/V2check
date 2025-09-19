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
# Если есть lock — используем ci; иначе install
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Копируем исходники (в т.ч. prisma/)
COPY . .

# === DIAG Prisma: показать схему, убрать BOM, валидировать, сгенерить
RUN set -eux; \
  echo "== Prisma files =="; \
  ls -la prisma || true; \
  (test -f prisma/schema.prisma && nl -ba prisma/schema.prisma | sed -n '1,200p') || true; \
  (test -f prisma/schema.prisma && sed -i '1s/^\xEF\xBB\xBF//' prisma/schema.prisma) || true; \
  npx prisma validate --schema=prisma/schema.prisma; \
  npx prisma generate --schema=prisma/schema.prisma

# Сборка Next
RUN npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Безопасный user
RUN useradd -m -u 1001 nodeuser

# Только то, что нужно для рантайма
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nodeuser
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["npm","run","start","-s"]
