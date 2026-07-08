#!/usr/bin/env node
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const categories = [
  ["performance", "performance", "Performance"],
  ["accessibility", "accessibility", "Accessibility"],
  ["best-practices", "bestPractices", "Best Practices"],
  ["seo", "seo", "SEO"],
];

const args = parseArgs(process.argv.slice(2));

try {
  const reports = readReports(args.reportsDir);
  const summary = summarizeReports(reports);
  writeFileSync(args.output, `${JSON.stringify(summary, null, 2)}\n`);
  appendSummary(args.summary, summary);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  appendSummary(args.summary, null, message);
  console.error(message);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    reportsDir: "./.lighthouseci",
    output: "./lighthouse-results.json",
    summary: process.env.GITHUB_STEP_SUMMARY ?? "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--reports-dir") {
      parsed.reportsDir = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--output") {
      parsed.output = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--summary") {
      parsed.summary = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function readValue(argv, index, arg) {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value`);
  }
  return value;
}

function readReports(reportsDir) {
  if (!existsSync(reportsDir)) {
    throw new Error(`Lighthouse report directory not found: ${reportsDir}`);
  }

  const files = readdirSync(reportsDir)
    .filter((file) => file.startsWith("lhr-") && file.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    throw new Error(`No Lighthouse JSON reports found in ${reportsDir}`);
  }

  return files.map((file) => {
    const path = join(reportsDir, file);
    const report = JSON.parse(readFileSync(path, "utf8"));
    return {
      source: file,
      url: report.finalUrl ?? report.requestedUrl ?? file,
      scores: readCategoryScores(report, file),
    };
  });
}

function readCategoryScores(report, source) {
  const scores = {};
  for (const [categoryKey, outputKey] of categories) {
    const score = report.categories?.[categoryKey]?.score;
    if (typeof score !== "number") {
      throw new Error(`Missing Lighthouse category score '${categoryKey}' in ${source}`);
    }
    scores[outputKey] = Math.round(score * 100);
  }
  return scores;
}

function summarizeReports(reports) {
  const urls = new Set();
  const summary = {
    performance: 100,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    urlCount: 0,
    reportCount: reports.length,
  };

  for (const report of reports) {
    urls.add(report.url);
    for (const [, outputKey] of categories) {
      summary[outputKey] = Math.min(summary[outputKey], report.scores[outputKey]);
    }
  }

  summary.urlCount = urls.size;
  return summary;
}

function appendSummary(summaryPath, summary, errorMessage = "") {
  if (!summaryPath) {
    return;
  }

  const lines = ["## Lighthouse Performance Report", ""];
  if (summary) {
    lines.push(
      `Audited ${summary.urlCount} URL(s) across ${summary.reportCount} Lighthouse run(s).`,
      "",
      "| Metric | Worst Score |",
      "|--------|-------------|",
    );
    for (const [, outputKey, label] of categories) {
      lines.push(`| ${label} | ${summary[outputKey]}% |`);
    }
  } else {
    lines.push(`WARNING: ${errorMessage}`);
  }
  lines.push("");
  appendFileSync(summaryPath, lines.join("\n"));
}
