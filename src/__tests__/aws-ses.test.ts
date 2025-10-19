/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const sesClientConstructor = vi.fn(() => ({ send: sendMock }));

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: sesClientConstructor,
  SendEmailCommand: vi.fn(),
}));

describe("createSESClient", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockClear();
    sesClientConstructor.mockClear();
    delete process.env.SKIP_ENV_VALIDATION;
  });

  afterEach(() => {
    delete process.env.SKIP_ENV_VALIDATION;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  it("creates a singleton client configured with environment credentials", async () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_ACCESS_KEY_ID = "id";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";

    const { createSESClient } = await import("@/lib/aws/ses");

    const clientA = createSESClient();
    const clientB = createSESClient();

    expect(clientA).toBe(clientB);
    expect(sesClientConstructor).toHaveBeenCalledTimes(1);
    expect(sesClientConstructor).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: {
        accessKeyId: "id",
        secretAccessKey: "secret",
      },
    });
  });

  it("throws a descriptive error when AWS_REGION is missing", async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    delete process.env.AWS_REGION;

    const { createSESClient } = await import("@/lib/aws/ses");

    expect(() => createSESClient()).toThrowError(/AWS_REGION/);
  });

  it("throws a descriptive error when AWS_ACCESS_KEY_ID is missing", async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    delete process.env.AWS_ACCESS_KEY_ID;

    const { createSESClient } = await import("@/lib/aws/ses");

    expect(() => createSESClient()).toThrowError(/AWS_ACCESS_KEY_ID/);
  });

  it("throws a descriptive error when AWS_SECRET_ACCESS_KEY is empty", async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_ACCESS_KEY_ID = "id";
    process.env.AWS_SECRET_ACCESS_KEY = "   ";

    const { createSESClient } = await import("@/lib/aws/ses");

    expect(() => createSESClient()).toThrowError(/AWS_SECRET_ACCESS_KEY/);
  });

  it("relies on the default provider chain when static credentials are omitted", async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    process.env.AWS_REGION = "us-west-2";
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    const { createSESClient } = await import("@/lib/aws/ses");

    createSESClient();

    expect(sesClientConstructor).toHaveBeenCalledWith({
      region: "us-west-2",
    });
  });

  it("trims surrounding whitespace from AWS credentials", async () => {
    process.env.AWS_REGION = "  us-west-2  ";
    process.env.AWS_ACCESS_KEY_ID = "  id  ";
    process.env.AWS_SECRET_ACCESS_KEY = "  secret  ";

    const { createSESClient } = await import("@/lib/aws/ses");

    createSESClient();

    expect(sesClientConstructor).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: {
        accessKeyId: "id",
        secretAccessKey: "secret",
      },
    });
  });
});
