#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const argv = process.argv.slice(2);

const getArg = (name) => {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
};

const suite = getArg("--suite");
const outputJson = getArg("--outJson");
const outputMd = getArg("--outMd");

if (!suite || !outputJson || !outputMd) {
  // biome-ignore lint/suspicious/noConsole: benchmark harness
  console.error("Usage: summarize-suite.mjs --suite <name> --outJson <path> --outMd <path>");
  process.exit(2);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const toMs = (seconds) => Math.round(seconds * 1000);

const quantile = (numbers, q) => {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[index] ?? null;
};

const summarizeHyperfine = (filePath) => {
  const raw = readJson(filePath);
  const result = raw.results?.[0];
  const times = Array.isArray(result?.times) ? result.times : [];
  const timesMs = times.map(toMs);
  return {
    rawPath: filePath,
    meanMs: result?.mean ? toMs(result.mean) : null,
    medianMs: result?.median ? toMs(result.median) : null,
    minMs: result?.min ? toMs(result.min) : null,
    maxMs: result?.max ? toMs(result.max) : null,
    p95Ms: quantile(timesMs, 0.95),
    runs: timesMs.length,
  };
};

const summarizeLighthouseDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return null;
  const walk = (currentPath) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const out = [];
    for (const entry of entries) {
      const next = path.join(currentPath, entry.name);
      if (entry.isDirectory()) out.push(...walk(next));
      else if (entry.isFile() && entry.name.endsWith(".json")) out.push(next);
    }
    return out;
  };

  const files = walk(dirPath);

  const lhrs = [];
  for (const file of files) {
    try {
      const lhr = readJson(file);
      if (lhr?.categories?.performance) lhrs.push(lhr);
    } catch {
      // ignore parse errors
    }
  }

  if (lhrs.length === 0) return null;

  const getAudit = (lhr, id) => lhr?.audits?.[id]?.numericValue ?? null;

  const performanceScores = lhrs
    .map((lhr) => lhr.categories.performance.score)
    .filter((v) => typeof v === "number")
    .map((v) => Math.round(v * 100));

  const lcpMs = lhrs.map((lhr) => getAudit(lhr, "largest-contentful-paint")).filter(Number.isFinite);
  const inpMs = lhrs
    .map((lhr) => getAudit(lhr, "interactive") ?? getAudit(lhr, "interaction-to-next-paint"))
    .filter(Number.isFinite);
  const cls = lhrs.map((lhr) => getAudit(lhr, "cumulative-layout-shift")).filter(Number.isFinite);

  const avg = (numbers) =>
    numbers.length === 0 ? null : Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);

  return {
    dir: dirPath,
    runs: lhrs.length,
    performanceScoreAvg: avg(performanceScores),
    lcpMsAvg: avg(lcpMs),
    inpMsAvg: avg(inpMs),
    clsAvg: cls.length === 0 ? null : Number((cls.reduce((a, b) => a + b, 0) / cls.length).toFixed(3)),
  };
};

const summarizeAutocannon = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  const raw = readJson(filePath);
  const latency = raw?.latency ?? {};
  const requests = raw?.requests ?? {};

  const estimateP95 = () => {
    const p90 = latency.p90;
    const p97_5 = latency.p97_5;
    if (typeof p90 !== "number" || typeof p97_5 !== "number") return null;
    // Autocannon CLI reports p97.5, not p95. We estimate p95 by interpolating between p90 and p97.5.
    // This is intended as a regression signal, not a statistically perfect p95.
    const q = (0.95 - 0.9) / (0.975 - 0.9);
    return Math.round(p90 + (p97_5 - p90) * q);
  };

  const directP95 = typeof latency.p95 === "number" ? latency.p95 : null;
  const estimatedP95 = directP95 ?? estimateP95();
  const p95Method =
    directP95 != null ? "direct" : estimatedP95 != null ? "estimatedFromP90AndP97_5" : null;

  return {
    rawPath: filePath,
    requestsPerSecMean: requests.average ?? null,
    latencyMsP50: latency.p50 ?? null,
    latencyMsP95: estimatedP95,
    latencyMsP95Method: p95Method,
    latencyMsP90: typeof latency.p90 === "number" ? latency.p90 : null,
    latencyMsP97_5: typeof latency.p97_5 === "number" ? latency.p97_5 : null,
  };
};

const tryCmd = (cmd, args2) => {
  try {
    return execFileSync(cmd, args2, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};

const root = process.cwd();
const rawDir = path.join(root, "benchmarks", "_raw", suite);

const hyperfineInstall = path.join(rawDir, "hyperfine", "install.json");
const hyperfineBuild = path.join(rawDir, "hyperfine", "build.json");
const hyperfineDev = path.join(rawDir, "hyperfine", "dev-time-to-ready.json");
const hyperfineStart = path.join(rawDir, "hyperfine", "prod-time-to-ready.json");

const lighthouseDir = path.join(root, "benchmarks", "lighthouse", suite);
const autocannonPath = path.join(root, "benchmarks", "load", suite, "autocannon.json");

const previousSummary = fs.existsSync(outputJson) ? readJson(outputJson) : null;

const summary = {
  suite,
  recordedAt: previousSummary?.recordedAt ?? new Date().toISOString(),
  machine:
    previousSummary?.machine ?? ({
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpuModel: os.cpus()?.[0]?.model ?? null,
      cpuCount: os.cpus()?.length ?? null,
      totalMemBytes: os.totalmem(),
    }),
  versions:
    previousSummary?.versions ?? ({
      node: tryCmd("node", ["-v"]),
      pnpm: suite.includes("pnpm") ? tryCmd("pnpm", ["-v"]) : null,
      bun: tryCmd("bun", ["-v"]),
      hyperfine: tryCmd("hyperfine", ["--version"]),
    }),
  metrics: {
    install: fs.existsSync(hyperfineInstall) ? summarizeHyperfine(hyperfineInstall) : null,
    build: fs.existsSync(hyperfineBuild) ? summarizeHyperfine(hyperfineBuild) : null,
    devTimeToReady: fs.existsSync(hyperfineDev) ? summarizeHyperfine(hyperfineDev) : null,
    prodTimeToReady: fs.existsSync(hyperfineStart) ? summarizeHyperfine(hyperfineStart) : null,
    lighthouse: summarizeLighthouseDir(lighthouseDir),
    loadTest: summarizeAutocannon(autocannonPath),
  },
  artifacts: {
    hyperfineDir: path.join("benchmarks", "_raw", suite, "hyperfine"),
    lighthouseDir: path.join("benchmarks", "lighthouse", suite),
    loadDir: path.join("benchmarks", "load", suite),
  },
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

const mdLines = [];
mdLines.push(`# Benchmarks: ${suite}`);
mdLines.push("");
mdLines.push("## Environment");
mdLines.push("");
mdLines.push(`- Recorded at: \`${summary.recordedAt}\``);
mdLines.push(`- Node: \`${summary.versions.node ?? "UNVERIFIED"}\``);
if (suite.includes("pnpm")) {
  mdLines.push(`- pnpm: \`${summary.versions.pnpm ?? "UNVERIFIED"}\``);
}
mdLines.push(`- Bun: \`${summary.versions.bun ?? "UNVERIFIED"}\``);
mdLines.push(`- hyperfine: \`${summary.versions.hyperfine ?? "UNVERIFIED"}\``);
mdLines.push("");

const metricRow = (label, metric) => {
  if (!metric) return `| ${label} | UNVERIFIED | UNVERIFIED |`;
  return `| ${label} | ${metric.meanMs} | ${metric.p95Ms} |`;
};

mdLines.push("## Timing (ms)");
mdLines.push("");
mdLines.push("| Benchmark | mean | p95 |");
mdLines.push("|----------|------|-----|");
mdLines.push(metricRow("Install", summary.metrics.install));
mdLines.push(metricRow("Build", summary.metrics.build));
mdLines.push(metricRow("Dev time-to-ready", summary.metrics.devTimeToReady));
mdLines.push(metricRow("Prod time-to-ready", summary.metrics.prodTimeToReady));
mdLines.push("");

if (summary.metrics.lighthouse) {
  const lh = summary.metrics.lighthouse;
  mdLines.push("## Lighthouse");
  mdLines.push("");
  mdLines.push(`- Runs: \`${lh.runs}\``);
  mdLines.push(`- Performance score avg: \`${lh.performanceScoreAvg}\``);
  mdLines.push(`- LCP avg (ms): \`${lh.lcpMsAvg ?? "UNVERIFIED"}\``);
  mdLines.push(`- INP/Interactive avg (ms): \`${lh.inpMsAvg ?? "UNVERIFIED"}\``);
  mdLines.push(`- CLS avg: \`${lh.clsAvg ?? "UNVERIFIED"}\``);
  mdLines.push("");
} else {
  mdLines.push("## Lighthouse");
  mdLines.push("");
  mdLines.push("- UNVERIFIED: No Lighthouse artifacts found.");
  mdLines.push("");
}

if (summary.metrics.loadTest) {
  const lt = summary.metrics.loadTest;
  mdLines.push("## Load test (autocannon)");
  mdLines.push("");
  mdLines.push(`- Throughput avg (req/s): \`${lt.requestsPerSecMean ?? "UNVERIFIED"}\``);
  mdLines.push(`- Latency p50 (ms): \`${lt.latencyMsP50 ?? "UNVERIFIED"}\``);
  if (lt.latencyMsP95Method === "estimatedFromP90AndP97_5") {
    mdLines.push(`- Latency p95 (ms): \`${lt.latencyMsP95 ?? "UNVERIFIED"}\` (estimated)`);
  } else {
    mdLines.push(`- Latency p95 (ms): \`${lt.latencyMsP95 ?? "UNVERIFIED"}\``);
  }
  mdLines.push("");
} else {
  mdLines.push("## Load test (autocannon)");
  mdLines.push("");
  mdLines.push("- UNVERIFIED: No autocannon artifacts found.");
  mdLines.push("");
}

mdLines.push("## Artifacts");
mdLines.push("");
mdLines.push(`- Hyperfine: \`${summary.artifacts.hyperfineDir}\``);
mdLines.push(`- Lighthouse: \`${summary.artifacts.lighthouseDir}\``);
mdLines.push(`- Load test: \`${summary.artifacts.loadDir}\``);
mdLines.push("");

fs.mkdirSync(path.dirname(outputMd), { recursive: true });
fs.writeFileSync(outputMd, `${mdLines.join("\n")}\n`, "utf8");
