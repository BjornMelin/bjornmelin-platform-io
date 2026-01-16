#!/usr/bin/env bash
set -euo pipefail

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3100}"
export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3100}"

# Minimal env to satisfy runtime env validation.
export CONTACT_EMAIL="${CONTACT_EMAIL:-test@example.com}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-$PLAYWRIGHT_BASE_URL}"
export NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL:-$PLAYWRIGHT_BASE_URL}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-$PLAYWRIGHT_BASE_URL/api}"

pnpm test:e2e

