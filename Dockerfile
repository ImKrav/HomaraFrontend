# ============================================
# Homara Frontend — Production Dockerfile
# ============================================
# Multi-stage build: deps → builder → runner
#   - Stage "deps":     installs all npm dependencies
#   - Stage "builder":  builds the Next.js production bundle
#   - Stage "runner":   minimal runtime image
#
# Build (with custom API URL):
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=http://api.example.com/api/v1 \
#     -t homara-frontend .
# Run (recommended via docker compose):
#   docker compose up -d
# ============================================

# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public env is inlined into the client bundle at build time.
# Pass --build-arg NEXT_PUBLIC_API_URL=... to override the default.
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ── Stage 3: Production runtime ──
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat wget

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy only what `next start` needs at runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000

CMD ["npm", "start"]
