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

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function aws(args, options = {}) {
  const result = spawnSync("aws", args, {
    stdio: "inherit",
    env: { ...process.env, AWS_STS_REGIONAL_ENDPOINTS: "regional" },
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`aws ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
  return result;
}

function awsJson(args) {
  const result = spawnSync("aws", [...args, "--output", "json"], {
    encoding: "utf8",
    env: { ...process.env, AWS_STS_REGIONAL_ENDPOINTS: "regional" },
  });
  if (result.status !== 0) {
    throw new Error(
      `aws ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}\n${result.stderr ?? ""}`,
    );
  }
  return JSON.parse(result.stdout);
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function readKvsPayload(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `KVS payload not found: ${filePath}\nRun \`pnpm build\` first (it generates CSP hashes + KVS payload).`,
    );
  }
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const data = Array.isArray(json?.data) ? json.data : null;
  if (!data) {
    throw new Error(`Invalid KVS payload format (expected {data:[...]}) in ${filePath}`);
  }
  const desired = new Map();
  for (const item of data) {
    const key = item?.key;
    const value = item?.value;
    if (typeof key !== "string" || typeof value !== "string") {
      throw new Error(`Invalid KVS item in ${filePath}: ${JSON.stringify(item)}`);
    }
    if (desired.has(key)) {
      throw new Error(`Duplicate KVS key in ${filePath}: ${key}`);
    }
    desired.set(key, value);
  }
  return desired;
}

function syncKeyValueStore(kvsArn, desired) {
  // List current keys/values.
  const list = awsJson(["cloudfront-keyvaluestore", "list-keys", "--kvs-arn", kvsArn]);
  const existing = new Map();
  for (const item of list?.Items ?? []) {
    if (typeof item?.Key !== "string" || typeof item?.Value !== "string") continue;
    existing.set(item.Key, item.Value);
  }

  const deletes = [];
  const puts = [];
  for (const [key, value] of desired.entries()) {
    const current = existing.get(key);
    if (current !== value) {
      puts.push({ Key: key, Value: value });
    }
  }
  for (const [key] of existing.entries()) {
    if (!desired.has(key)) {
      deletes.push({ Key: key });
    }
  }

  if (deletes.length === 0 && puts.length === 0) {
    // eslint-disable-next-line no-console
    console.log("KVS is already up to date.");
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Syncing KVS: ${kvsArn}`);
  // eslint-disable-next-line no-console
  console.log(`- puts: ${puts.length}`);
  // eslint-disable-next-line no-console
  console.log(`- deletes: ${deletes.length}`);

  let etag = awsJson([
    "cloudfront-keyvaluestore",
    "describe-key-value-store",
    "--kvs-arn",
    kvsArn,
  ]).ETag;
  if (!etag) throw new Error(`Failed to fetch KVS ETag for ${kvsArn}`);

  for (const batch of chunk(deletes, 50)) {
    const res = awsJson([
      "cloudfront-keyvaluestore",
      "update-keys",
      "--kvs-arn",
      kvsArn,
      "--if-match",
      etag,
      "--deletes",
      JSON.stringify(batch),
    ]);
    etag = res?.ETag ?? etag;
  }

  for (const batch of chunk(puts, 50)) {
    const res = awsJson([
      "cloudfront-keyvaluestore",
      "update-keys",
      "--kvs-arn",
      kvsArn,
      "--if-match",
      etag,
      "--puts",
      JSON.stringify(batch),
    ]);
    etag = res?.ETag ?? etag;
  }
}

const environment = readArg("--env") ?? process.env.PORTFOLIO_ENV ?? "prod";
const outDir = path.resolve(readArg("--out-dir") ?? "out");
const kvsPayloadPath = path.resolve(
  readArg("--kvs-payload") ?? "infrastructure/lib/generated/next-inline-script-hashes.kvs.json",
);
const dryRun = hasFlag("--dry-run");
const invalidationPaths = (readArg("--invalidation-paths") ?? "/*")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

if (!fs.existsSync(outDir)) {
  throw new Error(
    `out dir not found: ${outDir}\nRun \`pnpm build\` first so the static export exists.`,
  );
}

const { Exports } = awsJson(["cloudformation", "list-exports"]);

function getExportValue(name) {
  const found = Exports.find((e) => e.Name === name);
  if (!found?.Value) throw new Error(`CloudFormation export not found: ${name}`);
  return found.Value;
}

const bucketName = getExportValue(`${environment}-website-bucket-name`);
const distributionId = getExportValue(`${environment}-distribution-id`);
const kvsArn = getExportValue(`${environment}-csp-hashes-kvs-arn`);

// eslint-disable-next-line no-console
console.log(`Deploying static site: env=${environment}`);
// eslint-disable-next-line no-console
console.log(`- outDir: ${outDir}`);
// eslint-disable-next-line no-console
console.log(`- bucket: s3://${bucketName}`);
// eslint-disable-next-line no-console
console.log(`- distribution: ${distributionId}`);
// eslint-disable-next-line no-console
console.log(`- kvsArn: ${kvsArn}`);
// eslint-disable-next-line no-console
console.log(`- kvsPayload: ${kvsPayloadPath}`);
// eslint-disable-next-line no-console
console.log(`- dryRun: ${dryRun}`);

if (dryRun) {
  aws(["s3", "sync", outDir, `s3://${bucketName}`, "--delete", "--dryrun"]);
} else {
  aws(["s3", "sync", outDir, `s3://${bucketName}`, "--delete"]);
  syncKeyValueStore(kvsArn, readKvsPayload(kvsPayloadPath));
  aws([
    "cloudfront",
    "create-invalidation",
    "--distribution-id",
    distributionId,
    "--paths",
    ...invalidationPaths,
  ]);
}
