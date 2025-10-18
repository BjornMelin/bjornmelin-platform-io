# syntax=docker/dockerfile:1.7

# --- Base image with Node 24 (build-time only) ---
FROM node:24-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# --- Dependencies (offline store) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
 && corepack use $(node -p "require('./package.json').packageManager") \
 && pnpm fetch

# --- Build ---
FROM base AS build
COPY --from=deps /app/package.json /app/pnpm-lock.yaml ./
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
RUN corepack enable \
 && corepack use $(node -p "require('./package.json').packageManager") \
 && pnpm install --frozen-lockfile
COPY . .
# Next.js generates static assets in ./out because output: 'export'
RUN pnpm run build

# --- Runtime (static server) ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]

