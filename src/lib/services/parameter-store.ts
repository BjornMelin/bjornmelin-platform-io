import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

// Custom error types for Parameter Store operations
export class ParameterStoreError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "ParameterStoreError";
  }
}

export class ParameterNotFoundError extends ParameterStoreError {
  constructor(parameterName: string) {
    super(`Parameter not found: ${parameterName}`, "PARAMETER_NOT_FOUND", 404);
    this.name = "ParameterNotFoundError";
  }
}

export class ParameterAccessDeniedError extends ParameterStoreError {
  constructor(parameterName: string) {
    super(`Access denied to parameter: ${parameterName}`, "ACCESS_DENIED", 403);
    this.name = "ParameterAccessDeniedError";
  }
}

interface ResendParameterValue {
  apiKey: string;
  domain: string;
  fromEmail: string;
  version: number;
  rotatedAt: string;
}

interface ParameterCacheEntry {
  value: ResendParameterValue;
  fetchedAt: number;
  expiresAt: number;
}

export class ParameterStoreService {
  private static instance: ParameterStoreService;
  private ssmClient: SSMClient;
  private cloudWatchClient: CloudWatchClient;
  private cache = new Map<string, ParameterCacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly region: string;
  private readonly environment: string;

  private constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";
    this.environment = process.env.NODE_ENV === "production" ? "prod" : "dev";

    this.ssmClient = new SSMClient({
      region: this.region,
      maxAttempts: 3,
    });

    this.cloudWatchClient = new CloudWatchClient({
      region: this.region,
      maxAttempts: 2,
    });
  }

  public static getInstance(): ParameterStoreService {
    if (!ParameterStoreService.instance) {
      ParameterStoreService.instance = new ParameterStoreService();
    }
    return ParameterStoreService.instance;
  }

  /**
   * Get the Resend API key from Parameter Store with caching and monitoring
   */
  public async getResendApiKey(): Promise<string> {
    const parameterName = `/portfolio/${this.environment}/resend/api-key`;

    try {
      // Check cache first
      const cached = this.getCachedValue(parameterName);
      if (cached) {
        this.log("info", "Retrieved Resend API key from cache");
        return cached.apiKey;
      }

      // Fetch from Parameter Store
      this.log("info", "Fetching Resend API key from Parameter Store", { parameterName });

      const parameter = await this.getParameter(parameterName);
      const parameterValue: ResendParameterValue = JSON.parse(parameter);

      // Cache the value
      this.setCachedValue(parameterName, parameterValue);

      // Send CloudWatch metric for monitoring
      await this.recordParameterAccess(parameterName, true);

      this.log("info", "Successfully retrieved Resend API key from Parameter Store", {
        version: parameterValue.version,
        rotatedAt: parameterValue.rotatedAt,
      });

      return parameterValue.apiKey;
    } catch (error) {
      // Record failed access
      await this.recordParameterAccess(parameterName, false);

      this.log("error", "Failed to retrieve Resend API key from Parameter Store", error);

      if (error instanceof ParameterStoreError) {
        throw error;
      }

      throw new ParameterStoreError(
        "Failed to retrieve API key from Parameter Store",
        "FETCH_ERROR",
        undefined,
        error,
      );
    }
  }

  /**
   * Get a parameter from Parameter Store with error handling
   */
  private async getParameter(parameterName: string): Promise<string> {
    try {
      const response = await this.ssmClient.send(
        new GetParameterCommand({
          Name: parameterName,
          WithDecryption: true,
        }),
      );

      if (!response.Parameter?.Value) {
        throw new ParameterNotFoundError(parameterName);
      }

      return response.Parameter.Value;
    } catch (error: any) {
      if (error.name === "ParameterNotFound") {
        throw new ParameterNotFoundError(parameterName);
      }

      if (error.name === "AccessDeniedException") {
        throw new ParameterAccessDeniedError(parameterName);
      }

      throw new ParameterStoreError(
        `Failed to get parameter: ${parameterName}`,
        "GET_PARAMETER_ERROR",
        undefined,
        error,
      );
    }
  }

  /**
   * Get cached value if valid and not expired
   */
  private getCachedValue(parameterName: string): ResendParameterValue | null {
    const cached = this.cache.get(parameterName);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(parameterName);
      return null;
    }

    return cached.value;
  }

  /**
   * Cache parameter value with expiration
   */
  private setCachedValue(parameterName: string, value: ResendParameterValue): void {
    const now = Date.now();
    this.cache.set(parameterName, {
      value,
      fetchedAt: now,
      expiresAt: now + this.CACHE_TTL,
    });
  }

  /**
   * Record parameter access metrics to CloudWatch
   */
  private async recordParameterAccess(parameterName: string, success: boolean): Promise<void> {
    try {
      await this.cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: "Portfolio/EmailService",
          MetricData: [
            {
              MetricName: "ParameterAccess",
              Dimensions: [
                {
                  Name: "ParameterName",
                  Value: parameterName,
                },
                {
                  Name: "Environment",
                  Value: this.environment,
                },
                {
                  Name: "Success",
                  Value: success.toString(),
                },
              ],
              Value: 1,
              Unit: "Count",
              Timestamp: new Date(),
            },
          ],
        }),
      );
    } catch (error) {
      // Don't fail the main operation if metrics fail
      this.log("warn", "Failed to record CloudWatch metric", error);
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    size: number;
    entries: Array<{
      parameterName: string;
      fetchedAt: string;
      expiresAt: string;
      isExpired: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([parameterName, entry]) => ({
      parameterName,
      fetchedAt: new Date(entry.fetchedAt).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      isExpired: now > entry.expiresAt,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Log message with structured format for CloudWatch
   */
  private log(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: "ParameterStoreService",
      message,
      environment: this.environment,
      region: this.region,
      ...(data && { data }),
    };

    switch (level) {
      case "info":
        console.log(JSON.stringify(logEntry));
        break;
      case "warn":
        console.warn(JSON.stringify(logEntry));
        break;
      case "error":
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  /**
   * Health check for the Parameter Store service
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    region: string;
    environment: string;
    cacheStats: ReturnType<typeof this.getCacheStats>;
    lastError?: string;
  }> {
    try {
      // Try to access a test parameter to verify configuration
      await this.getResendApiKey();

      return {
        healthy: true,
        region: this.region,
        environment: this.environment,
        cacheStats: this.getCacheStats(),
      };
    } catch (error) {
      return {
        healthy: false,
        region: this.region,
        environment: this.environment,
        cacheStats: this.getCacheStats(),
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
