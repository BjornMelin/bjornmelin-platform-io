#!/usr/bin/env node

import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const argv = process.argv.slice(2);

const getArg = (name) => {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
};

const serverCmd = getArg("--serverCmd");
const url = getArg("--url") ?? "http://localhost:3000/";
const runCmd = getArg("--runCmd");
const runStdoutPath = getArg("--runStdoutPath");
const timeoutMs = Number(getArg("--timeoutMs") ?? "60000");
const cwd = getArg("--cwd") ?? process.cwd();

if (!serverCmd || !runCmd) {
  // biome-ignore lint/suspicious/noConsole: benchmark harness
  console.error(
    "Usage: with-server.mjs --serverCmd <cmd> --runCmd <cmd> [--runStdoutPath <file>] [--cwd <dir>] [--url <url>] [--timeoutMs <ms>]",
  );
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const child = spawn(serverCmd, {
  cwd,
  env: process.env,
  shell: true,
  detached: true,
  stdio: "inherit",
});

const killGroup = (signal) => {
  if (child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // fall through
    }
  }
  try {
    child.kill(signal);
  } catch {
    // ignore
  }
};

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

let isReady = false;
let exited = false;
let exitCode = null;
let exitSignal = null;
let lastError = null;

child.once("exit", (code, signal) => {
  exited = true;
  exitCode = code;
  exitSignal = signal;
});

while (!isReady) {
  if (exited) {
    lastError = new Error(
      `Server exited before readiness check succeeded (code=${exitCode}, signal=${exitSignal})`,
    );
    break;
  }

  try {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(url, { signal: controller.signal });
    if (response.status >= 200 && response.status < 400) {
      isReady = true;
      break;
    }
    lastError = new Error(`Non-success HTTP status: ${response.status}`);
  } catch (error) {
    lastError = error;
  }

  // eslint-disable-next-line no-await-in-loop
  await sleep(100);
}

clearTimeout(timeout);

if (!isReady) {
  // biome-ignore lint/suspicious/noConsole: benchmark harness
  console.error(
    JSON.stringify(
      {
        ok: false,
        url,
        timeoutMs,
        error: lastError?.message ?? "Unknown error",
      },
      null,
      2,
    ),
  );
  killGroup("SIGINT");
  setTimeout(() => killGroup("SIGKILL"), 3000);
  process.exit(1);
}

const normalizeJsonStdout = (stdout) => {
  const trimmed = stdout.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Try to extract the first JSON object by brace counting.
    let depth = 0;
    let started = false;
    for (let i = 0; i < trimmed.length; i += 1) {
      const char = trimmed[i];
      if (char === "{") {
        depth += 1;
        started = true;
      } else if (char === "}" && started) {
        depth -= 1;
        if (depth === 0) {
          const candidate = trimmed.slice(0, i + 1);
          JSON.parse(candidate);
          return candidate;
        }
      }
    }
    throw new Error("Unable to parse JSON stdout from runCmd");
  }
};

if (runStdoutPath) {
  const stdout = execSync(runCmd, { cwd, env: process.env, shell: true, encoding: "utf8" });
  const json = normalizeJsonStdout(stdout);
  fs.mkdirSync(path.dirname(runStdoutPath), { recursive: true });
  fs.writeFileSync(runStdoutPath, `${json}\n`, "utf8");
} else {
  execSync(runCmd, { cwd, env: process.env, stdio: "inherit", shell: true });
}

killGroup("SIGINT");
const killTimeout = setTimeout(() => killGroup("SIGKILL"), 3000);
await new Promise((resolve) => child.once("exit", resolve));
clearTimeout(killTimeout);
