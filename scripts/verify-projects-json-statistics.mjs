import { deepStrictEqual } from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

function roundTo(number, decimals) {
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
}

function computeStatistics(projects) {
  const numberOfProjects = projects.length;
  const totalStars = projects.reduce((sum, project) => sum + (project.stars ?? 0), 0);
  const averageStars = roundTo(totalStars / Math.max(1, numberOfProjects), 2);

  const licenseDistribution = {};
  const languageDistribution = {};

  for (const project of projects) {
    const licenseKey =
      project.license == null ? "unlicensed" : String(project.license).toLowerCase();
    licenseDistribution[licenseKey] = (licenseDistribution[licenseKey] ?? 0) + 1;

    const languageKey =
      typeof project.language === "string" ? project.language.toLowerCase() : "unknown";
    languageDistribution[languageKey] = (languageDistribution[languageKey] ?? 0) + 1;
  }

  const topRepositories = [...projects]
    .sort((a, b) => {
      const delta = (b.stars ?? 0) - (a.stars ?? 0);
      if (delta !== 0) return delta;
      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, 5)
    .map((project) => `${project.name} (${project.stars ?? 0} stars)`);

  return {
    totalStars,
    averageStars,
    numberOfProjects,
    topRepositories,
    languageDistribution,
    licenseDistribution,
  };
}

async function main() {
  const root = process.cwd();
  const projectsJsonPath = path.join(root, "docs", "development", "projects.json");

  const raw = await readFile(projectsJsonPath, "utf8");
  const parsed = JSON.parse(raw);

  const expected = computeStatistics(parsed.projects ?? []);
  const actual = parsed.statistics ?? {};

  const mismatches = [];
  for (const key of Object.keys(expected)) {
    const expectedValue = expected[key];
    const actualValue = actual[key];
    try {
      deepStrictEqual(actualValue, expectedValue);
    } catch {
      mismatches.push({ key, expected: expectedValue, actual: actualValue });
    }
  }

  if (mismatches.length > 0) {
    console.error("projects.json statistics mismatch:");
    for (const mismatch of mismatches) {
      console.error(`- ${mismatch.key}`);
      console.error(`  expected: ${JSON.stringify(mismatch.expected)}`);
      console.error(`  actual:   ${JSON.stringify(mismatch.actual)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("projects.json statistics OK");
}

await main();
