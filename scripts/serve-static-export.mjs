#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const serveBinPath = path.join(process.cwd(), "node_modules", "serve", "build", "main.js");
const forwardedArgs = process.argv.slice(2);

if (forwardedArgs[0] === "--") {
  forwardedArgs.shift();
}

const informationalArgs = new Set(["-h", "--help", "-v", "--version"]);
const serveArgs = forwardedArgs.some((arg) => informationalArgs.has(arg))
  ? forwardedArgs
  : ["-n", "out", ...forwardedArgs];

if (!existsSync(serveBinPath)) {
  console.error("Unable to find the local serve binary. Run `pnpm install` before serving.");
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, [serveBinPath, ...serveArgs], {
    env: {
      ...process.env,
      NO_UPDATE_CHECK: "1",
    },
    stdio: "inherit",
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      child.kill(signal);
    });
  }

  child.on("error", (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exitCode = 1;
      return;
    }

    process.exitCode = code ?? 1;
  });
}
