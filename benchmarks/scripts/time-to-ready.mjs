#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);

const getArg = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};

const cmd = getArg("--cmd");
const url = getArg("--url") ?? "http://localhost:3000/";
const timeoutMs = Number(getArg("--timeoutMs") ?? "60000");
const graceMs = Number(getArg("--graceMs") ?? "1500");
const cwd = getArg("--cwd") ?? process.cwd();

if (!cmd) {
  // biome-ignore lint/suspicious/noConsole: benchmark harness
  console.error("Missing required --cmd argument");
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const start = Date.now();

const child = spawn(cmd, {
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
let lastError = null;
let exited = false;
let exitCode = null;
let exitSignal = null;

child.once("exit", (code, signal) => {
  exited = true;
  exitCode = code;
  exitSignal = signal;
});

while (!isReady) {
  if (exited) {
    lastError = new Error(
      `Process exited before readiness check succeeded (code=${exitCode}, signal=${exitSignal})`,
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

const readyMs = Date.now() - start;

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

await sleep(graceMs);

if (!exited) {
  killGroup("SIGINT");
  const killTimeout = setTimeout(() => killGroup("SIGKILL"), 3000);
  await new Promise((resolve) => child.once("exit", resolve));
  clearTimeout(killTimeout);
}

// biome-ignore lint/suspicious/noConsole: benchmark harness output
console.log(JSON.stringify({ ok: true, url, readyMs }, null, 2));
