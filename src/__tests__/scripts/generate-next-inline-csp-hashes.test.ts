import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const scriptPath = path.join(process.cwd(), "scripts/generate-next-inline-csp-hashes.mjs");

let tempDir: string;

beforeEach(async () => {
  tempDir = mkdtempSync(path.join(tmpdir(), "csp-hashes-"));
  await mkdir(path.join(tempDir, "out/about"), { recursive: true });
  writeFileSync(
    path.join(tempDir, "out/index.html"),
    "<html><body><script>self.__next_f = self.__next_f || [];</script></body></html>",
    "utf8",
  );
  writeFileSync(
    path.join(tempDir, "out/about/index.html"),
    '<html><body><script>console.log("about");</script></body></html>',
    "utf8",
  );
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("generate-next-inline-csp-hashes", () => {
  it("writes per-build CSP payloads under ignored Next.js output by default", () => {
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: tempDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);

    const summary = JSON.parse(result.stdout) as {
      target: string;
      perPathTarget: string;
      perPathJsTarget: string;
      kvsTarget: string;
      functionTarget: string;
    };

    expect(path.relative(tempDir, summary.target)).toBe(".next/csp/next-inline-script-hashes.ts");
    expect(path.relative(tempDir, summary.perPathTarget)).toBe(
      ".next/csp/next-inline-script-hashes.json",
    );
    expect(path.relative(tempDir, summary.perPathJsTarget)).toBe(
      ".next/csp/next-inline-script-hashes.js",
    );
    expect(path.relative(tempDir, summary.kvsTarget)).toBe(
      ".next/csp/next-inline-script-hashes.kvs.json",
    );
    expect(path.relative(tempDir, summary.functionTarget)).toBe(
      "infrastructure/lib/functions/cloudfront/next-csp-response.js",
    );
    expect(existsSync(path.join(tempDir, "infrastructure/lib/generated"))).toBe(false);

    const kvsPayload = JSON.parse(readFileSync(summary.kvsTarget, "utf8")) as {
      data: Array<{ key: string; value: string }>;
    };
    expect(kvsPayload.data.some((item) => item.key === "/index.html")).toBe(true);
    expect(kvsPayload.data.some((item) => item.key === "/about/index.html")).toBe(true);
    expect(readFileSync(summary.functionTarget, "utf8")).toContain('import cf from "cloudfront"');
    expect(
      readFileSync(path.join(tempDir, ".next/csp/next-inline-script-hashes.ts"), "utf8"),
    ).toContain("NEXT_INLINE_SCRIPT_HASHES");
  });
});
