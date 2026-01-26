#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = process.argv.slice(2);

const getArg = (name) => {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
};

const dirArg = getArg("--dir") ?? "out";
const host = getArg("--host") ?? "0.0.0.0";
const port = Number(getArg("--port") ?? getArg("--listen") ?? "3000");
const quiet = argv.includes("--quiet");

const rootDir = path.resolve(__dirname, "..", dirArg);

if (!fs.existsSync(rootDir)) {
  // biome-ignore lint/suspicious/noConsole: CLI
  console.error(`Static directory not found: ${rootDir}`);
  process.exit(1);
}

const contentTypeFor = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".xml":
      return "application/xml; charset=utf-8";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
};

const resolveFilePath = (urlPathname) => {
  const decoded = decodeURIComponent(urlPathname);
  const safe = decoded.replaceAll("\0", "");

  const trimmed = safe.startsWith("/") ? safe.slice(1) : safe;
  const withoutQuery = trimmed.split("?")[0] ?? trimmed;

  const candidates = [];

  if (withoutQuery === "") {
    candidates.push("index.html");
  } else if (withoutQuery.endsWith("/")) {
    candidates.push(path.join(withoutQuery, "index.html"));
  } else {
    candidates.push(withoutQuery);
    candidates.push(path.join(withoutQuery, "index.html"));
    candidates.push(`${withoutQuery}.html`);
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(rootDir, candidate);
    if (!resolved.startsWith(rootDir + path.sep)) continue;
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
  }

  return null;
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const filePath = resolveFilePath(url.pathname);

  if (!filePath) {
    const notFoundPath = path.resolve(rootDir, "404.html");
    if (fs.existsSync(notFoundPath)) {
      res.statusCode = 404;
      res.setHeader("content-type", "text/html; charset=utf-8");
      fs.createReadStream(notFoundPath).pipe(res);
      return;
    }
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }

  const type = contentTypeFor(filePath);
  res.statusCode = 200;
  res.setHeader("content-type", type);
  res.setHeader("cache-control", "no-store");

  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  if (!quiet) {
    // biome-ignore lint/suspicious/noConsole: CLI
    console.log(`Serving ${rootDir} at http://${host}:${port}`);
  }
});
