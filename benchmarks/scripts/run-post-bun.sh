#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
SUITE="bun"

export SKIP_ENV_VALIDATION="true"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
export AWS_REGION="us-east-1"
export CONTACT_EMAIL="test@example.com"

WORKTREE_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$WORKTREE_DIR"
}
trap cleanup EXIT

(cd "$ROOT_DIR" && tar -cf - \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude="infrastructure/node_modules" \
  --exclude=".next" \
  --exclude="out" \
  --exclude="coverage" \
  --exclude="playwright-report" \
  --exclude="test-results" \
  --exclude="benchmarks/_raw" \
  --exclude="benchmarks/lighthouse" \
  --exclude="benchmarks/load" \
  --exclude="benchmarks/post-bun.json" \
  --exclude="benchmarks/post-bun.md" \
  .) | tar -x -C "$WORKTREE_DIR"

rm -rf "$ROOT_DIR/benchmarks/_raw/$SUITE" "$ROOT_DIR/benchmarks/lighthouse/$SUITE" "$ROOT_DIR/benchmarks/load/$SUITE"
mkdir -p "$ROOT_DIR/benchmarks/_raw/$SUITE/hyperfine" "$ROOT_DIR/benchmarks/lighthouse/$SUITE" "$ROOT_DIR/benchmarks/load/$SUITE"

cd "$WORKTREE_DIR"

echo "==> Benchmark: install (bun)"
hyperfine \
  --warmup 2 \
  --runs 10 \
  --prepare "rm -rf node_modules" \
  "bun ci" \
  --export-json "$ROOT_DIR/benchmarks/_raw/$SUITE/hyperfine/install.json"

echo "==> Benchmark: build (bun)"
hyperfine \
  --warmup 2 \
  --runs 10 \
  --prepare "rm -rf .next out" \
  "bun run build" \
  --export-json "$ROOT_DIR/benchmarks/_raw/$SUITE/hyperfine/build.json"

echo "==> Benchmark: dev time-to-ready (bun)"
hyperfine \
  --warmup 2 \
  --runs 10 \
  --prepare "rm -rf .next out" \
  "bun \"$ROOT_DIR/benchmarks/scripts/time-to-ready.mjs\" --cwd \"$WORKTREE_DIR\" --cmd \"bun run dev\" --url http://localhost:3000/ --timeoutMs 60000" \
  --export-json "$ROOT_DIR/benchmarks/_raw/$SUITE/hyperfine/dev-time-to-ready.json"

echo "==> Benchmark: prod time-to-ready (bun)"
bun run build
hyperfine \
  --warmup 2 \
  --runs 10 \
  "bun \"$ROOT_DIR/benchmarks/scripts/time-to-ready.mjs\" --cwd \"$WORKTREE_DIR\" --cmd \"bun run start -- --listen 3000\" --url http://localhost:3000/ --timeoutMs 30000" \
  --export-json "$ROOT_DIR/benchmarks/_raw/$SUITE/hyperfine/prod-time-to-ready.json"

echo "==> Lighthouse CI (bun)"
bunx playwright install chromium
CHROME_PATH="$(bun -e "console.log(require('playwright').chromium.executablePath())")"
LHCI_CONFIG="$ROOT_DIR/benchmarks/lighthouse/$SUITE/lighthouserc.runtime.json"
bun -e "import fs from 'node:fs'; const cfg = JSON.parse(fs.readFileSync('$ROOT_DIR/benchmarks/lighthouse/lighthouserc.bench.json', 'utf8')); cfg.ci.collect.staticDistDir = '$WORKTREE_DIR/out'; fs.writeFileSync('$LHCI_CONFIG', JSON.stringify(cfg, null, 2));"
(
  cd "$ROOT_DIR/benchmarks/lighthouse/$SUITE"
  bunx @lhci/cli@0.14.0 collect \
    --config "$LHCI_CONFIG" \
    --chromePath "$CHROME_PATH"
)

echo "==> Load test (autocannon via bunx)"
bun "$ROOT_DIR/benchmarks/scripts/with-server.mjs" \
  --cwd "$WORKTREE_DIR" \
  --serverCmd "bun run start -- --listen 3000" \
  --url "http://localhost:3000/" \
  --timeoutMs 30000 \
  --runStdoutPath "$ROOT_DIR/benchmarks/load/$SUITE/autocannon.json" \
  --runCmd "bunx autocannon@8.0.0 -c 50 -d 30 --json http://localhost:3000/"

(cd "$ROOT_DIR" && bun benchmarks/scripts/summarize-suite.mjs \
  --suite "$SUITE" \
  --outJson "benchmarks/post-bun.json" \
  --outMd "benchmarks/post-bun.md")

echo "==> Wrote benchmarks/post-bun.{json,md}"
