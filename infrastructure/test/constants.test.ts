import { describe, expect, it } from "vitest";
import { CONFIG, getStackName } from "../lib/constants";

describe("constants", () => {
  it("getStackName formats correctly", () => {
    expect(getStackName("storage", "prod")).toBe("prod-portfolio-storage");
  });

  it("has prod domain and email settings present", () => {
    expect(CONFIG.prod.domainName).toContain("bjornmelin.io");
    expect(CONFIG.prod.email.allowedOrigins).toContain("https://bjornmelin.io");
    expect(CONFIG.prod.alerts.emails.length).toBeGreaterThan(0);
  });
});
