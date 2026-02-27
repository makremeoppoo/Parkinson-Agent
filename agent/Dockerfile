# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# VITE_SERVER_URL is a build-time variable — pass it with --build-arg
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN yarn build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with our SPA config (port 8080 for Cloud Run)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run listens on 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
