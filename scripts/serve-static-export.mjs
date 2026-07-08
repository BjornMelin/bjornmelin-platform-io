#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requireFromScript = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const staticExportPath = path.resolve(scriptDir, "..", "out");
const servePackagePath = requireFromScript.resolve("serve/package.json");
const servePackage = JSON.parse(readFileSync(servePackagePath, "utf8"));
const serveBin = typeof servePackage.bin === "string" ? servePackage.bin : servePackage.bin?.serve;
const serveBinPath =
  typeof serveBin === "string" ? path.resolve(path.dirname(servePackagePath), serveBin) : "";
const forwardedArgs = process.argv.slice(2);
const signalExitCodes = new Map([
  ["SIGINT", 130],
  ["SIGTERM", 143],
]);

if (forwardedArgs[0] === "--") {
  forwardedArgs.shift();
}

const informationalArgs = new Set(["-h", "--help", "-v", "--version"]);
const serveArgs = forwardedArgs.some((arg) => informationalArgs.has(arg))
  ? forwardedArgs
  : ["-n", staticExportPath, ...forwardedArgs];

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
      process.exitCode = signalExitCodes.get(signal) ?? 1;
      return;
    }

    process.exitCode = code ?? 1;
  });
}
