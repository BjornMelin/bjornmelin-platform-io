#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

const resolveBaseUrl = () => {
  const fallback = "http://localhost:3100";
  const raw = process.env.PLAYWRIGHT_BASE_URL ?? fallback;
  try {
    return new URL(raw).toString();
  } catch {
    return fallback;
  }
};

const buildEnv = (baseUrl) => {
  const env = { ...process.env };
  const apiUrl = new URL("/api", baseUrl).toString();

  env.PLAYWRIGHT_SERVER_MODE = env.PLAYWRIGHT_SERVER_MODE ?? "static";
  env.PLAYWRIGHT_WORKERS = env.PLAYWRIGHT_WORKERS ?? "50%";
  env.PLAYWRIGHT_BASE_URL = env.PLAYWRIGHT_BASE_URL ?? baseUrl;
  env.SKIP_IMAGE_VARIANTS = env.SKIP_IMAGE_VARIANTS ?? "true";

  const basePort = (() => {
    try {
      return new URL(env.PLAYWRIGHT_BASE_URL).port || "3100";
    } catch {
      return "3100";
    }
  })();
  env.PLAYWRIGHT_PORT = env.PLAYWRIGHT_PORT ?? basePort;

  env.NEXT_PUBLIC_ALLOW_LOCAL_CONTACT = env.NEXT_PUBLIC_ALLOW_LOCAL_CONTACT ?? "true";
  env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL ?? baseUrl;
  env.NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL ?? baseUrl;
  env.NEXT_PUBLIC_API_URL = env.NEXT_PUBLIC_API_URL ?? apiUrl;

  return env;
};

const run = (command, args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });

const main = async () => {
  const baseUrl = resolveBaseUrl();
  const env = buildEnv(baseUrl);
  const extraArgs = process.argv.slice(2);
  const bunCommand = process.execPath.includes("bun") ? process.execPath : "bun";

  await run(bunCommand, ["run", "build"], env);

  const testArgs = ["run", "test:e2e"];
  if (extraArgs.length > 0) {
    testArgs.push("--", ...extraArgs);
  }
  await run(bunCommand, testArgs, env);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exit(1);
});
