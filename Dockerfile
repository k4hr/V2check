# ---------- deps ----------
FROM node:20-slim AS deps
ENV NODE_ENV=production
WORKDIR /app

# Базовые пакеты и openssl 3
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini \
    && rm -rf /var/lib/apt/lists/*

# Копируем манифесты
COPY package.json ./
COPY package-lock.json* ./

# Установка зависимостей без запуска скриптов (postinstall отключён)
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi

# ---------- builder ----------
FROM node:20-slim AS builder
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash \
    && rm -rf /var/lib/apt/lists/*

# Переносим node_modules из deps
COPY --from=deps /app/node_modules ./node_modules

# Весь проект
COPY . .

# Генерируем Prisma и билдим Next
# Важно: postinstall у нас не срабатывал ранее, поэтому явно генерируем
RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl tini \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1001 nodeuser

# Копируем артефакты
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Не рут
USER nodeuser

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["npm","run","start","-s"]
