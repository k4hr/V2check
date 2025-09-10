# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma на Alpine требует OpenSSL (для надёжности ставим совместимость 1.1)
RUN apk add --no-cache openssl1.1-compat || apk add --no-cache openssl

# Копируем манифесты для установки зависимостей
COPY package.json ./
COPY package-lock.json* ./

# Если lock есть — npm ci, иначе npm install; БЕЗ скриптов (postinstall отключён)
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --ignore-scripts ; \
    else \
      npm install --no-audit --no-fund --ignore-scripts ; \
    fi

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl1.1-compat || apk add --no-cache openssl

# Переносим node_modules из слоя deps
COPY --from=deps /app/node_modules ./node_modules

# Копируем весь проект (тут уже есть prisma/schema.prisma)
COPY . .

# Генерируем Prisma-клиента и билдим Next
RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Копируем только то, что нужно для рантайма
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm","run","start","-s"]
