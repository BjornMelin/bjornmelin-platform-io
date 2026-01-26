#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
SUITE="node-pnpm"

if [[ ! -f "$ROOT_DIR/pnpm-lock.yaml" ]]; then
  echo "ERROR: pnpm-lock.yaml is not present in this checkout." >&2
  echo "This repo has migrated to Bun; baseline benchmarks are historical." >&2
  echo "To re-run the Node+pnpm baseline, check out a pre-migration commit that still contains pnpm-lock.yaml." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is not installed." >&2
  echo "This repo has migrated to Bun; baseline benchmarks are historical." >&2
  echo "Install pnpm only if you are intentionally re-running the historical baseline." >&2
  exit 1
fi

export SKIP_ENV_VALIDATION="true"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
export AWS_REGION="us-east-1"
export CONTACT_EMAIL="test@example.com"

cd "$ROOT_DIR"

rm -rf "benchmarks/_raw/$SUITE" "benchmarks/lighthouse/$SUITE" "benchmarks/load/$SUITE"
mkdir -p "benchmarks/_raw/$SUITE/hyperfine" "benchmarks/lighthouse/$SUITE" "benchmarks/load/$SUITE"

echo "==> Benchmark: install (pnpm)"
hyperfine \
  --warmup 2 \
  --runs 10 \
  --prepare "rm -rf node_modules" \
  "pnpm install --frozen-lockfile" \
  --export-json "benchmarks/_raw/$SUITE/hyperfine/install.json"

echo "==> Benchmark: build (pnpm)"
hyperfine \
  --warmup 2 \
  --runs 10 \
  --prepare "rm -rf .next out" \
  "pnpm run build" \
  --export-json "benchmarks/_raw/$SUITE/hyperfine/build.json"

echo "==> Benchmark: dev time-to-ready (pnpm)"
hyperfine \
  --warmup 2 \
  --runs 10 \
  --prepare "rm -rf .next out" \
  "node benchmarks/scripts/time-to-ready.mjs --cmd \"pnpm run dev\" --url http://localhost:3000/ --timeoutMs 60000" \
  --export-json "benchmarks/_raw/$SUITE/hyperfine/dev-time-to-ready.json"

echo "==> Benchmark: prod time-to-ready (pnpm)"
pnpm run build
hyperfine \
  --warmup 2 \
  --runs 10 \
  "node benchmarks/scripts/time-to-ready.mjs --cmd \"npx serve@latest out --listen 3000\" --url http://localhost:3000/ --timeoutMs 30000" \
  --export-json "benchmarks/_raw/$SUITE/hyperfine/prod-time-to-ready.json"

echo "==> Lighthouse CI (pnpm)"
pnpm exec playwright install chromium
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"
(
  cd "benchmarks/lighthouse/$SUITE"
  pnpm dlx @lhci/cli@0.14.0 collect \
    --config "$ROOT_DIR/benchmarks/lighthouse/lighthouserc.bench.json" \
    --chromePath "$CHROME_PATH"
)

echo "==> Load test (autocannon via pnpm dlx)"
node benchmarks/scripts/with-server.mjs \
  --serverCmd "npx serve@latest out --listen 3000" \
  --url "http://localhost:3000/" \
  --timeoutMs 30000 \
  --runCmd "pnpm dlx autocannon@8.0.0 -c 50 -d 30 --json http://localhost:3000/ > benchmarks/load/$SUITE/autocannon.json"

node benchmarks/scripts/summarize-suite.mjs \
  --suite "$SUITE" \
  --outJson "benchmarks/baseline-node-pnpm.json" \
  --outMd "benchmarks/baseline-node-pnpm.md"

echo "==> Wrote benchmarks/baseline-node-pnpm.{json,md}"
