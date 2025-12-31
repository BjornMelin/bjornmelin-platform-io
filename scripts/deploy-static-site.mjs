import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
}

function aws(args, options = {}) {
  const result = spawnSync("aws", args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`aws ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
  return result;
}

function awsJson(args) {
  const result = spawnSync("aws", [...args, "--output", "json"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `aws ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}\n${result.stderr ?? ""}`,
    );
  }
  return JSON.parse(result.stdout);
}

const environment = readArg("--env") ?? process.env.PORTFOLIO_ENV ?? "prod";
const outDir = path.resolve(readArg("--out-dir") ?? "out");
const invalidationPaths = (readArg("--invalidation-paths") ?? "/*")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

if (!fs.existsSync(outDir)) {
  throw new Error(`out dir not found: ${outDir}\nRun \`pnpm build\` first so the static export exists.`);
}

const { Exports } = awsJson(["cloudformation", "list-exports"]);

function getExportValue(name) {
  const found = Exports.find((e) => e.Name === name);
  if (!found?.Value) throw new Error(`CloudFormation export not found: ${name}`);
  return found.Value;
}

const bucketName = getExportValue(`${environment}-website-bucket-name`);
const distributionId = getExportValue(`${environment}-distribution-id`);

// eslint-disable-next-line no-console
console.log(`Deploying static site: env=${environment}`);
// eslint-disable-next-line no-console
console.log(`- outDir: ${outDir}`);
// eslint-disable-next-line no-console
console.log(`- bucket: s3://${bucketName}`);
// eslint-disable-next-line no-console
console.log(`- distribution: ${distributionId}`);

aws(["s3", "sync", outDir, `s3://${bucketName}`, "--delete"]);
aws(["cloudfront", "create-invalidation", "--distribution-id", distributionId, "--paths", ...invalidationPaths]);

