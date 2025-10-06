/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
