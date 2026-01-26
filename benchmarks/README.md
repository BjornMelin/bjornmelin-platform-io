# Benchmarks

This folder contains repeatable performance benchmarks for:

- Baseline: Node.js + pnpm (historical)
- Post-migration: Bun

Benchmarks are intended to be run on a clean working tree with stable conditions.

## What gets measured

- Install time (Hyperfine)
- Build time (Hyperfine)
- Dev server cold start: time-to-ready for `GET /` (Hyperfine + polling harness)
- Prod server cold start: time-to-ready for `GET /` (Hyperfine + polling harness)
- Lighthouse CI (static `out/` build, local Chromium)
- Load test (autocannon; lightweight regression signal)

## Prerequisites

- `hyperfine` (install with `cargo install hyperfine --locked`)
- Playwright Chromium (installed by the benchmark scripts)

## Run

Baseline (Node + pnpm):

```bash
# Baseline is historical. This script requires a pre-migration checkout that still includes pnpm-lock.yaml.
./benchmarks/scripts/run-baseline-node-pnpm.sh
```

Post-migration (Bun):

```bash
./benchmarks/scripts/run-post-bun.sh
```

## Outputs

- `benchmarks/baseline-node-pnpm.md` and `benchmarks/baseline-node-pnpm.json`
- `benchmarks/post-bun.md` and `benchmarks/post-bun.json`
- Raw artifacts:
  - `benchmarks/_raw/`
  - `benchmarks/lighthouse/`
  - `benchmarks/load/`

## Comparison

See `benchmarks/benchmark-comparison.md` for the current delta summary.

## Notes

- Each benchmark suite captures machine specs and versions in its JSON (`machine`, `versions`).
- Load-test p95 latency is estimated (autocannon CLI does not report p95 directly).
