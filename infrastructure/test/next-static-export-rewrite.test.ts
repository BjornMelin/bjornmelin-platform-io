import * as fs from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import { describe, expect, it } from "vitest";

type CloudFrontHeaders = Record<string, { value: string }>;
type CloudFrontRequest = { uri: string; headers?: CloudFrontHeaders };

function loadCloudFrontRewriteHandler(): (event: {
  request: CloudFrontRequest;
}) => CloudFrontRequest {
  const filePath = path.join(
    __dirname,
    "../lib/functions/cloudfront/next-static-export-rewrite.js",
  );
  const code = fs.readFileSync(filePath, "utf8");

  const context: Record<string, unknown> = {};
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.__handler = handler;`, context, { filename: filePath });

  const handler = context.__handler;
  if (typeof handler !== "function") {
    throw new Error("Expected CloudFront Function file to define a global `handler` function.");
  }
  return handler as (event: { request: CloudFrontRequest }) => CloudFrontRequest;
}

describe("next-static-export-rewrite CloudFront Function", () => {
  const handler = loadCloudFrontRewriteHandler();

  it("rewrites extensionless paths to index.html", () => {
    expect(handler({ request: { uri: "/about" } }).uri).toBe("/about/index.html");
    expect(handler({ request: { uri: "/about/" } }).uri).toBe("/about/index.html");
    expect(handler({ request: { uri: "/api/v1.0/users" } }).uri).toBe("/api/v1.0/users/index.html");
  });

  it("rewrites React Server Component requests to index.txt", () => {
    expect(handler({ request: { uri: "/about", headers: { rsc: { value: "1" } } } }).uri).toBe(
      "/about/index.txt",
    );
    expect(
      handler({
        request: { uri: "/about", headers: { accept: { value: "text/html, text/x-component" } } },
      }).uri,
    ).toBe("/about/index.txt");
  });

  it("does not rewrite paths with file extensions", () => {
    expect(handler({ request: { uri: "/style.css" } }).uri).toBe("/style.css");
    expect(handler({ request: { uri: "/images/logo.png" } }).uri).toBe("/images/logo.png");
  });

  it("handles the root path", () => {
    expect(handler({ request: { uri: "/" } }).uri).toBe("/index.html");
    expect(handler({ request: { uri: "/", headers: { rsc: { value: "1" } } } }).uri).toBe(
      "/index.txt",
    );
  });

  it("handles empty headers object", () => {
    expect(handler({ request: { uri: "/about", headers: {} } }).uri).toBe("/about/index.html");
    expect(handler({ request: { uri: "/", headers: {} } }).uri).toBe("/index.html");
  });
});
