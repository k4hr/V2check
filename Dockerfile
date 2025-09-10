# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Копируем только манифесты для установки зависимостей
COPY package.json ./
# Если есть lock — копируем его тоже (не обязательно)
COPY package-lock.json* ./

# Если есть package-lock.json -> npm ci; иначе -> npm install
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund ; \
    else \
      npm install --no-audit --no-fund ; \
    fi

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Переносим node_modules из deps
COPY --from=deps /app/node_modules ./node_modules

# Копируем остальной проект
COPY . .

# Генерация Prisma клиента и билд Next.js
RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Копируем сборку и публичные файлы
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Копируем package.json и node_modules (для next start)
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start", "-s"]
