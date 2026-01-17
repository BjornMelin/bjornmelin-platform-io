const pathHashes = require("../../generated/next-inline-script-hashes.json");

const BASE_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

const SCRIPT_PREFIX = "script-src 'self'";

const CONNECT_SRC_BY_HOST = {
  "bjornmelin.io": "https://api.bjornmelin.io",
  "www.bjornmelin.io": "https://api.bjornmelin.io",
  "example.com": "https://api.example.com",
  "www.example.com": "https://api.example.com",
};

function normalizePath(uri) {
  if (!uri) return "/index.html";
  const decoded = decodeURIComponent(uri.split("?")[0].split("#")[0]);
  if (decoded.endsWith("/")) return `${decoded}index.html`;
  if (!decoded.includes(".")) return `${decoded}/index.html`;
  return decoded;
}

function buildCsp(host, hashes) {
  const connectSrc = CONNECT_SRC_BY_HOST[host] ?? `https://api.${host}`;
  const script = `${SCRIPT_PREFIX} ${hashes.map((hash) => `'${hash}'`).join(" ")}`;
  return [...BASE_DIRECTIVES, script, `connect-src 'self' ${connectSrc}`].join("; ");
}

function handler(event) {
  const request = event.request;
  const response = event.response;
  const uri = request.uri || "/index.html";
  const normalized = normalizePath(uri);
  const hashes =
    pathHashes[normalized] ?? pathHashes["/404.html"] ?? pathHashes["/index.html"] ?? [];

  const hostHeader = request.headers?.host?.value ?? "";
  const csp = buildCsp(hostHeader, hashes);

  response.headers["content-security-policy"] = { value: csp };
  return response;
}

module.exports = { handler };
