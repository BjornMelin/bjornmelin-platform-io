#!/usr/bin/env ts-node
import { execSync } from "node:child_process";

type Bump = "patch" | "minor" | "major";

const levelRank: Record<Bump, number> = { patch: 1, minor: 2, major: 3 };
let chosen: Bump = "patch";
const evidence: string[] = [];
const uncertainty = false;

function setBump(level: Bump, why: string) {
  if (levelRank[level] > levelRank[chosen]) {
    chosen = level;
  }
  evidence.push(`${level.toUpperCase()}: ${why}`);
}

function run(cmd: string, cwd = process.cwd()): string {
  return execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
}

function latestSemverTag(): string | null {
  try {
    const out = run('git tag --list "v*.*.*" --sort=-v:refname | head -n1').trim();
    return out || null;
  } catch {
    return null;
  }
}

function listFilesAt(ref: string): string[] {
  const out = run(`git ls-tree -r --name-only ${ref}`);
  return out.split("\n").filter(Boolean);
}

function fileAt(ref: string, p: string): string | null {
  try {
    return run(`git show ${ref}:${p}`);
  } catch {
    return null;
  }
}

function appRoutes(files: string[]): string[] {
  return files
    .filter((f) => f.startsWith("src/app/") && /\/(page|route)\.(t|j)sx?$/.test(f))
    .filter((f) => /\/page\.(t|j)sx?$/.test(f))
    .map((f) => f.replace(/^src\/app\//, "").replace(/\/page\.(t|j)sx?$/, ""))
    .map((seg) => `/${seg.replace(/\/index\/?$/, "").replace(/\/$/, "")}`)
    .map((path) => (path === "/" ? "/" : `/${path.replace(/^\//, "")}`))
    .map((p) => p.replace(/\/+/g, "/"))
    .sort();
}

function envRequiredVars(src: string): Set<string> {
  // Best-effort: find @t3-oss/env-nextjs createEnv and z.object({ ... required by zod(default none) })
  // We approximate: any z.string() without .optional() is required.
  const req = new Set<string>();
  const objectMatch = src.match(/z\.object\(\{([\s\S]*?)\}\)/);
  if (!objectMatch) return req;
  const body = objectMatch[1];
  const re = /([A-Z0-9_]+):\s*z\.[a-zA-Z0-9_]+\((?:[^)]*)\)(?!\.optional\(\))/g;
  for (let m: RegExpExecArray | null = re.exec(body); m; m = re.exec(body)) {
    req.add(m[1]);
  }
  return req;
}

function main() {
  const headRef = "HEAD";
  const tag = latestSemverTag();
  const baseRef = tag ?? run("git rev-list --max-parents=0 HEAD").trim();

  const headFiles = listFilesAt(headRef);
  const baseFiles = listFilesAt(baseRef);

  // Route heuristics
  const headRoutes = new Set(appRoutes(headFiles));
  const baseRoutes = new Set(appRoutes(baseFiles));
  for (const r of Array.from(baseRoutes)) {
    if (!headRoutes.has(r)) {
      setBump("major", `Route removed or renamed: ${r}`);
    }
  }
  for (const r of Array.from(headRoutes)) {
    if (!baseRoutes.has(r)) {
      setBump("minor", `Route added: ${r}`);
    }
  }

  // Env schema heuristics
  const envPath = "src/env.mjs";
  const baseEnv = fileAt(baseRef, envPath);
  const headEnv = fileAt(headRef, envPath);
  if (headEnv) {
    const headReq = envRequiredVars(headEnv);
    const baseReq = baseEnv ? envRequiredVars(baseEnv) : new Set<string>();
    for (const v of Array.from(headReq)) {
      if (!baseReq.has(v)) setBump("major", `New required env var: ${v}`);
    }
    // Optional detection is non-trivial without full AST; skip minor env additions for now.
  }

  // API schema heuristics (very light): if route.ts changed under app/, prefer minor unless deletions found.
  const filterRouteImpl = (files: string[]) =>
    files.filter((f) => f.startsWith("src/app/") && /\/route\.(t|j)sx?$/.test(f));
  const baseApi = new Set(filterRouteImpl(baseFiles));
  const headApi = new Set(filterRouteImpl(headFiles));
  for (const f of Array.from(baseApi)) if (!headApi.has(f)) setBump("major", `API route removed: ${f}`);
  for (const f of Array.from(headApi)) if (!baseApi.has(f)) setBump("minor", `API route added: ${f}`);

  // If no evidence found, default to patch
  if (evidence.length === 0)
    evidence.push("No public surface changes detected; defaulting to PATCH");

  const out = { bump_floor: chosen, evidence, uncertainty };
  process.stdout.write(JSON.stringify(out, null, 2));
}

main();
