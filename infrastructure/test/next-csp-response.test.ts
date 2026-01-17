import * as fs from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import { describe, expect, it } from "vitest";

type CloudFrontHeaders = Record<string, { value: string }>;
type CloudFrontRequest = { uri: string; headers?: CloudFrontHeaders };
type CloudFrontResponse = { headers?: CloudFrontHeaders };

/**
 * Loads the CSP response handler from the CloudFront Function file.
 * Uses Node's vm module to execute the function in an isolated context,
 * simulating the CloudFront Functions runtime environment.
 *
 * `@returns` The handler function extracted from the CloudFront Function file
 * `@throws` Error if the file doesn't define a global `handler` function
 */
function loadCspResponseHandler(): (event: {
  request: CloudFrontRequest;
  response: CloudFrontResponse;
}) => CloudFrontResponse {
  const filePath = path.join(__dirname, "../lib/functions/cloudfront/next-csp-response.js");
  const code = fs.readFileSync(filePath, "utf8");

  const context: Record<string, unknown> = {};
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.__handler = handler;`, context, { filename: filePath });

  const handler = context.__handler;
  if (typeof handler !== "function") {
    throw new Error("Expected CloudFront Function file to define a global `handler` function.");
  }
  return handler as (event: {
    request: CloudFrontRequest;
    response: CloudFrontResponse;
  }) => CloudFrontResponse;
}

describe("next-csp-response CloudFront Function", () => {
  const handler = loadCspResponseHandler();

  it("applies CSP header with script hashes for known paths", () => {
    const response = handler({
      request: { uri: "/about", headers: { host: { value: "example.com" } } },
      response: { headers: {} },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("falls back to 404 hashes when path is unknown", () => {
    const response = handler({
      request: { uri: "/missing/path", headers: { host: { value: "example.com" } } },
      response: { headers: {} },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
  });

  it("handles dots in directory names by checking the last path segment", () => {
    const response = handler({
      request: { uri: "/api.v2/users", headers: { host: { value: "example.com" } } },
      response: { headers: {} },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("sha256-");
  });

  it("uses connect-src 'self' when host is unrecognized", () => {
    const response = handler({
      request: { uri: "/", headers: { host: { value: "unknown.example" } } },
      response: { headers: {} },
    });
    const csp = response.headers?.["content-security-policy"]?.value ?? "";

    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("connect-src 'self' https://api.unknown.example");
  });
});
