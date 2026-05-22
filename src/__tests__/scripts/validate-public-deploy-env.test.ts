import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const scriptPath = "scripts/validate-public-deploy-env.mjs";

function runValidator(env: Record<string, string | undefined>) {
  return spawnSync(
    process.execPath,
    [scriptPath, "--environment", "production", "--require-aws-role", "--require-contact-email"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env,
      },
      encoding: "utf8",
    },
  );
}

describe("validate-public-deploy-env", () => {
  const validEnv = {
    AWS_DEPLOY_ROLE_ARN: "arn:aws:iam::123456789012:role/prod-portfolio-deploy",
    CONTACT_EMAIL: "contact@example.com",
    NEXT_PUBLIC_API_URL: "https://api.example.com",
    NEXT_PUBLIC_APP_URL: "https://example.com",
    NEXT_PUBLIC_BASE_URL: "https://example.com",
  };

  it("accepts valid production deploy variables", () => {
    const result = runValidator(validEnv);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Validated public deploy environment: production");
    expect(result.stderr).toBe("");
  });

  it("rejects missing public URL variables", () => {
    const result = runValidator({ ...validEnv, NEXT_PUBLIC_API_URL: "" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Missing required variable: NEXT_PUBLIC_API_URL");
  });

  it("rejects non-HTTPS public URLs", () => {
    const result = runValidator({ ...validEnv, NEXT_PUBLIC_APP_URL: "http://example.com" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXT_PUBLIC_APP_URL must be a valid https:// URL");
  });

  it("rejects HTTPS values without the double-slash URL prefix", () => {
    const result = runValidator({ ...validEnv, NEXT_PUBLIC_API_URL: "https:api.example.com" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXT_PUBLIC_API_URL must be a valid https:// URL");
  });

  it("rejects malformed AWS role ARNs", () => {
    const result = runValidator({ ...validEnv, AWS_DEPLOY_ROLE_ARN: "prod-role" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("AWS_DEPLOY_ROLE_ARN must be a full IAM Role ARN");
  });

  it("rejects missing environment argument values", () => {
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--environment", "--require-aws-role"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          ...validEnv,
        },
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--environment requires a value");
  });

  it("rejects invalid contact email variables", () => {
    const result = runValidator({ ...validEnv, CONTACT_EMAIL: "not-email" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("CONTACT_EMAIL must be a valid email address");
  });
});
