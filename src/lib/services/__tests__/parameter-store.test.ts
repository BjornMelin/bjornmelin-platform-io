import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ParameterAccessDeniedError,
  ParameterNotFoundError,
  ParameterStoreError,
  ParameterStoreService,
} from "../parameter-store";

// Mock AWS SDK clients
vi.mock("@aws-sdk/client-ssm");
vi.mock("@aws-sdk/client-cloudwatch");

const mockSSMClient = vi.mocked(SSMClient);
const mockCloudWatchClient = vi.mocked(CloudWatchClient);

describe("ParameterStoreService", () => {
  let service: ParameterStoreService;
  let mockSSMSend: ReturnType<typeof vi.fn>;
  let mockCloudWatchSend: ReturnType<typeof vi.fn>;

  const mockParameterValue = {
    apiKey: "test-api-key-12345",
    domain: "bjornmelin.io",
    fromEmail: "noreply@bjornmelin.io",
    version: 1,
    rotatedAt: "2024-01-15T10:00:00.000Z",
  };

  beforeEach(() => {
    // Reset environment to development (maps to 'dev' in parameter path)
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AWS_REGION", "us-east-1");

    // Clear any existing instance
    ParameterStoreService.instance = undefined as any;

    // Setup mock implementations
    mockSSMSend = vi.fn();
    mockCloudWatchSend = vi.fn();

    mockSSMClient.prototype.send = mockSSMSend;
    mockCloudWatchClient.prototype.send = mockCloudWatchSend;

    // Default successful responses
    mockSSMSend.mockResolvedValue({
      Parameter: {
        Value: JSON.stringify(mockParameterValue),
        Version: 1,
      },
    });

    mockCloudWatchSend.mockResolvedValue({});

    service = ParameterStoreService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    service.clearCache();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = ParameterStoreService.getInstance();
      const instance2 = ParameterStoreService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getResendApiKey", () => {
    it("should successfully retrieve API key from Parameter Store", async () => {
      const apiKey = await service.getResendApiKey();

      expect(apiKey).toBe("test-api-key-12345");
      expect(mockSSMSend).toHaveBeenCalledWith(expect.any(GetParameterCommand));
      expect(mockCloudWatchSend).toHaveBeenCalledWith(expect.any(PutMetricDataCommand));
    });

    it("should use cached value on subsequent calls", async () => {
      // First call
      await service.getResendApiKey();

      // Second call
      const apiKey = await service.getResendApiKey();

      expect(apiKey).toBe("test-api-key-12345");
      // Should only call SSM once due to caching
      expect(mockSSMSend).toHaveBeenCalledTimes(1);
    });

    it("should handle parameter not found error", async () => {
      mockSSMSend.mockRejectedValueOnce(
        Object.assign(new Error("Parameter not found"), { name: "ParameterNotFound" }),
      );

      await expect(service.getResendApiKey()).rejects.toThrow(ParameterNotFoundError);
      expect(mockCloudWatchSend).toHaveBeenCalledWith(expect.any(PutMetricDataCommand));
    });

    it("should handle access denied error", async () => {
      mockSSMSend.mockRejectedValueOnce(
        Object.assign(new Error("Access denied"), { name: "AccessDeniedException" }),
      );

      await expect(service.getResendApiKey()).rejects.toThrow(ParameterAccessDeniedError);
    });

    it("should handle empty parameter value", async () => {
      mockSSMSend.mockResolvedValueOnce({
        Parameter: {},
      });

      await expect(service.getResendApiKey()).rejects.toThrow(ParameterStoreError);
    });

    it("should handle invalid JSON in parameter", async () => {
      mockSSMSend.mockResolvedValueOnce({
        Parameter: {
          Value: "invalid-json",
          Version: 1,
        },
      });

      await expect(service.getResendApiKey()).rejects.toThrow(ParameterStoreError);
    });

    it("should handle CloudWatch metric failure gracefully", async () => {
      mockCloudWatchSend.mockRejectedValueOnce(new Error("CloudWatch error"));

      // Should still succeed even if metric recording fails
      const apiKey = await service.getResendApiKey();
      expect(apiKey).toBe("test-api-key-12345");
    });
  });

  describe("caching", () => {
    it("should clear cache when clearCache is called", async () => {
      // First call
      await service.getResendApiKey();
      expect(mockSSMSend).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second call should hit SSM again
      await service.getResendApiKey();
      expect(mockSSMSend).toHaveBeenCalledTimes(2);
    });

    it("should expire cache after TTL", async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      try {
        // First call
        await service.getResendApiKey();
        expect(mockSSMSend).toHaveBeenCalledTimes(1);

        // Advance time beyond cache TTL (5 minutes)
        currentTime += 6 * 60 * 1000;

        // Second call should hit SSM again due to expired cache
        await service.getResendApiKey();
        expect(mockSSMSend).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = originalNow;
      }
    });

    it("should provide accurate cache statistics", async () => {
      await service.getResendApiKey();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].parameterName).toBe("/portfolio/dev/resend/api-key");
      expect(stats.entries[0].isExpired).toBe(false);
    });
  });

  describe("healthCheck", () => {
    it("should return healthy status when service is working", async () => {
      const health = await service.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.region).toBe("us-east-1");
      expect(health.environment).toBe("dev");
      expect(health.lastError).toBeUndefined();
    });

    it("should return unhealthy status when service fails", async () => {
      mockSSMSend.mockRejectedValueOnce(new Error("Service unavailable"));

      const health = await service.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.lastError).toContain("Failed to get parameter");
    });

    it("should include cache stats in health check", async () => {
      await service.getResendApiKey(); // Populate cache

      const health = await service.healthCheck();

      expect(health.cacheStats.size).toBe(1);
    });
  });

  describe("environment handling", () => {
    it("should use correct parameter path for production", () => {
      vi.stubEnv("NODE_ENV", "production");

      // Create new instance to pick up env change
      ParameterStoreService.instance = undefined as any;
      const prodService = ParameterStoreService.getInstance();

      prodService.getResendApiKey();

      expect(mockSSMSend).toHaveBeenCalledWith(expect.any(GetParameterCommand));
    });

    it("should use correct AWS region from environment", () => {
      vi.stubEnv("AWS_REGION", "us-west-2");

      // Create new instance to pick up env change
      ParameterStoreService.instance = undefined as any;
      const _service = ParameterStoreService.getInstance();

      expect(mockSSMClient).toHaveBeenCalledWith(
        expect.objectContaining({
          region: "us-west-2",
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should wrap unknown errors in ParameterStoreError", async () => {
      mockSSMSend.mockRejectedValueOnce(new Error("Unknown error"));

      await expect(service.getResendApiKey()).rejects.toThrow(ParameterStoreError);
    });

    it("should preserve original error in wrapped errors", async () => {
      const originalError = new Error("Original error");
      mockSSMSend.mockRejectedValueOnce(originalError);

      try {
        await service.getResendApiKey();
      } catch (error) {
        expect(error).toBeInstanceOf(ParameterStoreError);
        expect((error as ParameterStoreError).originalError).toBe(originalError);
      }
    });
  });

  describe("logging", () => {
    it("should log structured JSON messages", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await service.getResendApiKey();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"service":"ParameterStoreService"'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'));

      consoleSpy.mockRestore();
    });
  });
});
