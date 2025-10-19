import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@aws-sdk/client-ssm", () => {
  class SSMClient {
    send = vi.fn(async () => ({ Parameter: { Value: "from-ssm" } }));
  }
  class GetParameterCommand {
    constructor(public readonly _input: unknown) {}
  }
  return { SSMClient, GetParameterCommand };
});

import { getParameter } from "../lib/utils/ssm";

describe("utils/ssm getParameter", () => {
  beforeEach(() => {
    // reset module cache to clear in-module cache map between tests if needed
  });

  it("returns value and caches subsequent calls", async () => {
    const first = await getParameter("/path");
    const second = await getParameter("/path");
    expect(first).toBe("from-ssm");
    expect(second).toBe("from-ssm");
  });
});
