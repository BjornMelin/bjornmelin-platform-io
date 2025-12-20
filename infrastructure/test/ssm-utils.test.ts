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
    expect(mockSend).toHaveBeenCalledTimes(2);

    // After 150ms, path1 should be expired but path2 still valid
    vi.setSystemTime(now + 150);

    // Calling getParameter triggers pruneExpiredEntries which removes /path1
    await getParameter("/path3", false, { cacheTtlMs: 1000 });
    expect(mockSend).toHaveBeenCalledTimes(3);

    // Clear call count to verify /path1 was pruned
    mockSend.mockClear();

    // /path1 should require a fresh fetch since it was pruned
    await getParameter("/path1", false, { cacheTtlMs: 100 });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ _input: { Name: "/path1", WithDecryption: false } }),
    );

    // /path2 should still be cached (not expired yet at 150ms with 200ms TTL)
    mockSend.mockClear();
    await getParameter("/path2", false, { cacheTtlMs: 200 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns empty string when parameter is missing", async () => {
    mockSend.mockResolvedValue({ Parameter: undefined });
    const result = await getParameter("/missing");
    expect(result).toBe("");
  });
});
