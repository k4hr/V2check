# Dockerfile
# Надёжная база на Debian (glibc): уходим от Alpine/musl проблем Prisma

# ---------- deps ----------
FROM node:20-slim AS deps
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY package-lock.json* ./
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
    ca-certificates openssl curl bash && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---------- runner ----------
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl tini && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1001 nodeuser
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
USER nodeuser
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["npm","run","start","-s"]
