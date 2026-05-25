#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

const manifestPaths = ["package.json", "infrastructure/package.json"];

function parseNodeMajor(nvmrc) {
  const match = nvmrc.trim().match(/^v?(\d+)(?:\.|$)/);
  if (!match) {
    throw new Error(`Unable to parse Node major from .nvmrc value "${nvmrc.trim()}".`);
  }

  return Number.parseInt(match[1], 10);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function getNodeTypesRange(manifest, manifestPath) {
  const range =
    manifest.devDependencies?.["@types/node"] ?? manifest.dependencies?.["@types/node"] ?? null;

  if (typeof range !== "string") {
    throw new Error(`${manifestPath} must declare @types/node in dependencies or devDependencies.`);
  }

  return range;
}

try {
  const repoRoot = process.cwd();
  const nodeMajor = parseNodeMajor(await readFile(path.join(repoRoot, ".nvmrc"), "utf8"));
  const expectedRange = `^${nodeMajor}.0.0`;
  const failures = [];

  for (const manifestPath of manifestPaths) {
    const absoluteManifestPath = path.join(repoRoot, manifestPath);
    const manifest = await readJson(absoluteManifestPath);
    const actualRange = getNodeTypesRange(manifest, manifestPath);

    if (actualRange !== expectedRange) {
      failures.push(`${manifestPath}: expected @types/node ${expectedRange}, found ${actualRange}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }

  console.log(
    `Verified @types/node range ${expectedRange} for Node ${nodeMajor} in ${manifestPaths.join(", ")}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
