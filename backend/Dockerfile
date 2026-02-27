# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure the data directory exists and is writable
RUN mkdir -p data && chown -R appuser:appgroup /app

USER appuser

# Cloud Run injects PORT automatically (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
