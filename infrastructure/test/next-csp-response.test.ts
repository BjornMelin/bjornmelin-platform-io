import * as fs from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

type CloudFrontHeaders = Record<string, { value: string }>;
type CloudFrontRequest = { uri: string; headers?: CloudFrontHeaders };
type CloudFrontResponse = { headers?: CloudFrontHeaders };

/**
 * Loads the CSP response handler from the CloudFront Function file.
 * Uses Node's vm module to execute the function in an isolated context,
 * simulating the CloudFront Functions runtime environment.
 *
 * @returns The handler function extracted from the CloudFront Function file
 * @throws Error if the file doesn't define a global `handler` function
 */
function loadCspResponseHandler(): (event: {
  request: CloudFrontRequest;
  response: CloudFrontResponse;
}) => Promise<CloudFrontResponse> {
  const filePath = path.join(__dirname, "../lib/functions/cloudfront/next-csp-response.js");
  const rawCode = fs.readFileSync(filePath, "utf8");
  const code = rawCode.replace(/^import\s+cf\s+from\s+['"]cloudfront['"];\s*$/m, "");

  const get = vi.fn(async (_key: string) => "0");
  const context: Record<string, unknown> = { cf: { kvs: () => ({ get }) } };
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.__handler = handler;`, context, { filename: filePath });

  const handler = context.__handler;
  if (typeof handler !== "function") {
    throw new Error("Expected CloudFront Function file to define a global `handler` function.");
  }
  return handler as (event: {
    request: CloudFrontRequest;
    response: CloudFrontResponse;
  }) => Promise<CloudFrontResponse>;
}

describe("next-csp-response CloudFront Function", () => {
  it("applies CSP header with script hashes for known paths", async () => {
    const handler = loadCspResponseHandler();
    const response = await handler({
      request: { uri: "/about", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "text/html; charset=utf-8" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("falls back to 404 hashes when path is unknown", async () => {
    const filePath = path.join(__dirname, "../lib/functions/cloudfront/next-csp-response.js");
    const rawCode = fs.readFileSync(filePath, "utf8");
    const code = rawCode.replace(/^import\s+cf\s+from\s+['"]cloudfront['"];\s*$/m, "");

    const get = vi.fn(async (key: string) => {
      if (key === "/404.html") return "0";
      return null;
    });
    const context: Record<string, unknown> = { cf: { kvs: () => ({ get }) } };
    vm.createContext(context);
    vm.runInContext(`${code}\nthis.__handler = handler;`, context, { filename: filePath });
    const localHandler = context.__handler as (event: {
      request: CloudFrontRequest;
      response: CloudFrontResponse;
    }) => Promise<CloudFrontResponse>;

    const response = await localHandler({
      request: { uri: "/missing/path", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "text/html" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
    expect(get).toHaveBeenCalled();
  });

  it("handles dots in directory names by checking the last path segment", async () => {
    const handler = loadCspResponseHandler();
    const response = await handler({
      request: { uri: "/api.v2/users", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "text/html" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
  });

  it("uses connect-src 'self' when host is unrecognized", async () => {
    const handler = loadCspResponseHandler();
    const response = await handler({
      request: { uri: "/", headers: { host: { value: "unknown.example" } } },
      response: { headers: { "content-type": { value: "text/html" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("connect-src 'self' https://api.unknown.example");
  });

  it("normalizes trailing slashes to index.html", async () => {
    const handler = loadCspResponseHandler();
    const response = await handler({
      request: { uri: "/about/", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "text/html" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("handles URIs with query strings and fragments", async () => {
    const handler = loadCspResponseHandler();
    const response = await handler({
      request: { uri: "/about?x=1#frag", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "text/html" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("falls back to connect-src 'self' when host is missing", async () => {
    const handler = loadCspResponseHandler();
    const response = await handler({
      request: { uri: "/about" },
      response: { headers: { "content-type": { value: "text/html" } } },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
    expect(csp).toContain("connect-src 'self'");
  });

  it("fails soft when KVS has no keys yet (does not set CSP)", async () => {
    const filePath = path.join(__dirname, "../lib/functions/cloudfront/next-csp-response.js");
    const rawCode = fs.readFileSync(filePath, "utf8");
    const code = rawCode.replace(/^import\s+cf\s+from\s+['"]cloudfront['"];\s*$/m, "");

    const get = vi.fn(async (_key: string) => null);
    const context: Record<string, unknown> = { cf: { kvs: () => ({ get }) } };
    vm.createContext(context);
    vm.runInContext(`${code}\nthis.__handler = handler;`, context, { filename: filePath });
    const localHandler = context.__handler as (event: {
      request: CloudFrontRequest;
      response: CloudFrontResponse;
    }) => Promise<CloudFrontResponse>;

    const response = await localHandler({
      request: { uri: "/about", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "text/html" } } },
    });

    expect(get).toHaveBeenCalled();
    expect(response.headers?.["content-security-policy"]).toBeUndefined();
  });

  it("skips KVS lookups for non-HTML requests", async () => {
    const filePath = path.join(__dirname, "../lib/functions/cloudfront/next-csp-response.js");
    const rawCode = fs.readFileSync(filePath, "utf8");
    const code = rawCode.replace(/^import\s+cf\s+from\s+['"]cloudfront['"];\s*$/m, "");

    const get = vi.fn(async (_key: string) => "0");
    const context: Record<string, unknown> = {
      cf: { kvs: () => ({ get }) },
    };
    vm.createContext(context);
    vm.runInContext(`${code}\nthis.__handler = handler;`, context, { filename: filePath });
    const localHandler = context.__handler as (event: {
      request: CloudFrontRequest;
      response: CloudFrontResponse;
    }) => Promise<CloudFrontResponse>;

    const response = await localHandler({
      request: { uri: "/_next/static/chunks/app.js", headers: { host: { value: "example.com" } } },
      response: { headers: { "content-type": { value: "application/javascript" } } },
    });

    expect(get).not.toHaveBeenCalled();
    expect(response.headers?.["content-security-policy"]).toBeUndefined();
  });
});
