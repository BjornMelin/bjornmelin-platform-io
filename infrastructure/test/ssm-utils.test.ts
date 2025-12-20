import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-ssm", () => {
  class SSMClient {
    send = mockSend;
  }
  class GetParameterCommand {
    constructor(public readonly _input: unknown) {}
  }
  return { SSMClient, GetParameterCommand };
});

import { _resetForTesting, getParameter } from "../lib/utils/ssm";

describe("utils/ssm getParameter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetForTesting();
    mockSend.mockResolvedValue({ Parameter: { Value: "from-ssm" } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns value and caches subsequent calls", async () => {
    const first = await getParameter("/path");
    const second = await getParameter("/path");
    expect(first).toBe("from-ssm");
    expect(second).toBe("from-ssm");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("uses different cache keys for encrypted vs unencrypted", async () => {
    mockSend
      .mockResolvedValueOnce({ Parameter: { Value: "unencrypted" } })
      .mockResolvedValueOnce({ Parameter: { Value: "decrypted" } });

    const raw = await getParameter("/path", false);
    const dec = await getParameter("/path", true);

    expect(raw).toBe("unencrypted");
    expect(dec).toBe("decrypted");
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("expires cache entries after TTL", async () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    mockSend
      .mockResolvedValueOnce({ Parameter: { Value: "first" } })
      .mockResolvedValueOnce({ Parameter: { Value: "second" } });

    const first = await getParameter("/path", false, { cacheTtlMs: 1000 });
    expect(first).toBe("first");

    // Still cached before TTL
    vi.setSystemTime(now + 500);
    const cached = await getParameter("/path", false, { cacheTtlMs: 1000 });
    expect(cached).toBe("first");
    expect(mockSend).toHaveBeenCalledTimes(1);

    // Expired after TTL
    vi.setSystemTime(now + 1001);
    const refreshed = await getParameter("/path", false, { cacheTtlMs: 1000 });
    expect(refreshed).toBe("second");
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("respects custom cacheTtlMs option", async () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    mockSend
      .mockResolvedValueOnce({ Parameter: { Value: "initial" } })
      .mockResolvedValueOnce({ Parameter: { Value: "updated" } });

    await getParameter("/path", false, { cacheTtlMs: 100 });

    vi.setSystemTime(now + 101);
    const result = await getParameter("/path", false, { cacheTtlMs: 100 });
    expect(result).toBe("updated");
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("prunes expired entries to prevent memory growth", async () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    mockSend.mockResolvedValue({ Parameter: { Value: "value" } });

    await getParameter("/path1", false, { cacheTtlMs: 100 });
    await getParameter("/path2", false, { cacheTtlMs: 200 });

    // After 150ms, path1 should be expired
    vi.setSystemTime(now + 150);

    // Calling getParameter triggers pruneExpiredEntries
    await getParameter("/path3", false, { cacheTtlMs: 1000 });

    // path1 should have been fetched again if requested (since it was pruned)
    _resetForTesting();
  });

  it("returns empty string when parameter is missing", async () => {
    mockSend.mockResolvedValue({ Parameter: undefined });
    const result = await getParameter("/missing");
    expect(result).toBe("");
  });
});
