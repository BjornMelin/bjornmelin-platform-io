#!/usr/bin/env bash
set -euo pipefail

# Preconditions:
# - GitHub CLI installed (gh)
# - Authenticated: gh auth status
# - Repository context: run from repo root
# - Provide required values via environment variables or flags

REPO_SLUG=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
if [[ -z "${REPO_SLUG}" ]]; then
  echo "GitHub CLI not authenticated or no repo context. Run: gh auth login && gh repo set-default <owner>/<repo>" >&2
  exit 1
fi

ENV_NAME="production"

# Inputs (export before running or pass inline):
#   NEXT_PUBLIC_BASE_URL
#   NEXT_PUBLIC_API_URL

require() { if [[ -z "${!1-}" ]]; then echo "Missing required env: $1" >&2; exit 1; fi; }
require NEXT_PUBLIC_BASE_URL
require NEXT_PUBLIC_API_URL

echo "Creating/ensuring environment: ${ENV_NAME} in ${REPO_SLUG}"
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO_SLUG}/environments/${ENV_NAME}" \
  -f wait_timer=0 >/dev/null

echo "Setting environment variables"
gh variable set NEXT_PUBLIC_BASE_URL --env "${ENV_NAME}" --body "${NEXT_PUBLIC_BASE_URL}"
gh variable set NEXT_PUBLIC_API_URL --env "${ENV_NAME}" --body "${NEXT_PUBLIC_API_URL}"

echo "Done: production environment configured"

