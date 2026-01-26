import fs from "node:fs";
import process from "node:process";

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) {
  throw new Error("GITHUB_STEP_SUMMARY is not set.");
}

const resultPath = "./lighthouse-results.json";
const lines = [];
lines.push("## Lighthouse Performance Report");
lines.push("");

if (fs.existsSync(resultPath)) {
  try {
    const results = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    const metrics = {
      performance: results?.performance,
      accessibility: results?.accessibility,
      bestPractices: results?.bestPractices,
      seo: results?.seo,
    };

    lines.push("| Metric | Score |");
    lines.push("|--------|-------|");
    lines.push(`| Performance | ${metrics.performance}% |`);
    lines.push(`| Accessibility | ${metrics.accessibility}% |`);
    lines.push(`| Best Practices | ${metrics.bestPractices}% |`);
    lines.push(`| SEO | ${metrics.seo}% |`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lines.push(`⚠️ Error parsing Lighthouse results: ${message}`);
  }
} else {
  lines.push("⚠️ Lighthouse results not found. The performance check may have failed.");
}

lines.push("");
fs.appendFileSync(summaryPath, lines.join("\n"));
