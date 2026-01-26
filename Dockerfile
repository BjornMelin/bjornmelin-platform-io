# syntax=docker/dockerfile:1.7

# --- Base image with Bun (build-time only) ---
FROM oven/bun:1.3.6 AS base
ENV NODE_ENV=production
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun ci

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/bun.lock ./
COPY . .
# Next.js generates static assets in ./out because output: 'export'
RUN bun run build

# --- Runtime (static server) ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
