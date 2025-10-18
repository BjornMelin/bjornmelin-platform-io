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

/** @type {{ metadata?: { vulnerabilities?: Record<string, number> } }} */
let parsed = {};

try {
  const raw = readFileSync(reportPath, "utf8");
  parsed = JSON.parse(raw);
} catch (error) {
  console.error(`Failed to read pnpm audit report at ${reportPath}:`, error);
  process.exit(1);
}

const counts = parsed.metadata?.vulnerabilities ?? {};
const orderedSeverities = Object.entries(counts)
  .map(([key, count]) => ({ severity: key.toLowerCase(), count: Number(count ?? 0) }))
  .filter(({ count }) => count > 0)
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
    `## pnpm audit summary\n\n${summaryLines.join("\n")}\n`,
    { flag: "a" },
  );
} else {
  console.log(summaryLines.join("\n"));
}

if (severityRank[highest] >= severityRank.high) {
  console.error(`pnpm audit detected ${highest} vulnerabilities. Failing job.`);
  process.exit(1);
}

console.log(`pnpm audit highest severity: ${highest}. Job continues.`);
