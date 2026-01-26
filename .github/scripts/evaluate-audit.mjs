import { readFileSync, writeFileSync } from "node:fs";

const severityRank = {
  none: 0,
  info: 1,
  low: 2,
  moderate: 3,
  high: 4,
  critical: 5,
};

const reportPath = process.env.AUDIT_REPORT_PATH ?? "audit-report.json";

/** @type {unknown} */
let parsed = {};

try {
  const raw = readFileSync(reportPath, "utf8");
  parsed = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to read bun audit report at ${reportPath}:`, error);
  process.exit(1);
}

const counts = { none: 0, info: 0, low: 0, moderate: 0, high: 0, critical: 0 };

const collectSeverities = (value, seen, depth) => {
  if (depth > 20) return;
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized in severityRank) counts[normalized] += 1;
    return;
  }

  if (typeof value !== "object") return;

  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) collectSeverities(item, seen, depth + 1);
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if (key.toLowerCase() === "severity" && typeof item === "string") {
      const normalized = item.toLowerCase();
      if (normalized in severityRank) counts[normalized] += 1;
      continue;
    }
    collectSeverities(item, seen, depth + 1);
  }
};

collectSeverities(parsed, new Set(), 0);

const orderedSeverities = Object.entries(counts)
  .map(([severity, count]) => ({ severity, count }))
  .filter(({ severity, count }) => severity !== "none" && count > 0)
  .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

const highest = orderedSeverities[0]?.severity ?? "none";

const summaryLines = [
  "| Severity | Count |",
  "|----------|-------|",
  ...orderedSeverities.map(({ severity, count }) => `| ${severity} | ${count} |`),
];

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## bun audit summary\n\n${summaryLines.join("\n")}\n`,
    { flag: "a" },
  );
} else {
  console.log(summaryLines.join("\n"));
}

if (severityRank[highest] >= severityRank.high) {
  console.error(`bun audit detected ${highest} vulnerabilities. Failing job.`);
  process.exit(1);
}

console.log(`bun audit highest severity: ${highest}. Job continues.`);
