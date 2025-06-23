import { Resend } from "resend";
import { env } from "@/env.mjs";
import type { EnhancedContactFormData } from "@/lib/validation/contact-schema";
import { ParameterStoreService } from "./parameter-store";

// Custom error types for better error handling
export class ResendEmailError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "ResendEmailError";
  }
}

export class ResendConfigurationError extends ResendEmailError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ResendConfigurationError";
  }
}

export class ResendRateLimitError extends ResendEmailError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "ResendRateLimitError";
  }
}

// Types for enhanced functionality
export interface EmailResult {
  id: string;
  retries?: number;
  timestamp?: string;
}

export interface BatchEmailResult {
  successful: EmailResult[];
  failed: Array<{
    email: string;
    error: ResendEmailError;
  }>;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Template for the contact form email
const ContactEmailTemplate = ({
  name,
  email,
  message,
  timestamp,
}: EnhancedContactFormData & { timestamp: string }) => ({
  from: `Contact Form <${env.RESEND_FROM_EMAIL || "no-reply@bjornmelin.io"}>`,
  to: env.CONTACT_EMAIL || "bjornmelin16@gmail.com",
  subject: `New Contact Form Submission from ${name}`,
  text: `
Name: ${name}
Email: ${email}
Message: ${message}
Time: ${timestamp}
  `.trim(),
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #ffffff;
    }
    .header { 
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #0070f3;
    }
    .header h2 {
      margin: 0;
      color: #0070f3;
      font-size: 24px;
    }
    .content { 
      margin: 20px 0;
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
    }
    .field {
      margin-bottom: 15px;
    }
    .field-label {
      font-weight: 600;
      color: #555;
      margin-bottom: 5px;
      display: block;
    }
    .field-value {
      color: #333;
      word-wrap: break-word;
    }
    .message-content {
      white-space: pre-wrap;
      background: #ffffff;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    .footer { 
      font-size: 12px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
      text-align: center;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px;
      border-radius: 4px;
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    
    <div class="content">
      <div class="field">
        <span class="field-label">Name:</span>
        <span class="field-value">${name}</span>
      </div>
      
      <div class="field">
        <span class="field-label">Email:</span>
        <span class="field-value"><a href="mailto:${email}">${email}</a></span>
      </div>
      
      <div class="field">
        <span class="field-label">Message:</span>
        <div class="message-content">${message}</div>
      </div>
    </div>
    
    <div class="warning">
      <strong>Note:</strong> This email was sent from the contact form on bjornmelin.io. 
      Please verify the sender's email address before responding.
    </div>
    
    <div class="footer">
      <p>Submitted at: ${timestamp}</p>
      <p>This is an automated message from bjornmelin.io</p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  replyTo: email,
});

export class ResendEmailService {
  private static instance: ResendEmailService;
  private resend: Resend | null = null;
  private retryOptions: Required<RetryOptions>;
  private parameterStoreService: ParameterStoreService;
  private isInitialized = false;

  private constructor(retryOptions?: RetryOptions) {
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
    this.parameterStoreService = ParameterStoreService.getInstance();
  }

  public static getInstance(retryOptions?: RetryOptions): ResendEmailService {
    if (!ResendEmailService.instance) {
      ResendEmailService.instance = new ResendEmailService(retryOptions);
    }
    return ResendEmailService.instance;
  }

  /**
   * Initialize the Resend client with API key from Parameter Store
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized && this.resend) {
      return;
    }

    try {
      // In development/test, fall back to environment variable if available
      let apiKey: string;

      if (process.env.NODE_ENV === "development" && env.RESEND_API_KEY) {
        apiKey = env.RESEND_API_KEY;
        this.log("info", "Using Resend API key from environment variable for development");
      } else {
        // Fetch from Parameter Store for production
        apiKey = await this.parameterStoreService.getResendApiKey();
        this.log("info", "Retrieved Resend API key from Parameter Store");
      }

      this.resend = new Resend(apiKey);
      this.isInitialized = true;
    } catch (error) {
      this.log("error", "Failed to initialize Resend client", error);
      throw new ResendConfigurationError(
        "Failed to initialize Resend client. API key could not be retrieved.",
      );
    }
  }

  /**
   * Log message with appropriate level
   */
  private log(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[ResendEmailService] [${timestamp}] ${message}`;

    switch (level) {
      case "info":
        console.log(logMessage, data || "");
        break;
      case "warn":
        console.warn(logMessage, data || "");
        break;
      case "error":
        console.error(logMessage, data || "");
        break;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryOptions.initialDelay * this.retryOptions.backoffMultiplier ** attempt,
      this.retryOptions.maxDelay,
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof ResendEmailError) {
      // Rate limit errors are retryable
      if (error.code === "RATE_LIMIT_ERROR") return true;
      // 5xx errors are typically retryable
      if (error.statusCode && error.statusCode >= 500) return true;
    }
    // Network errors are retryable
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("econnrefused") ||
        message.includes("enotfound")
      );
    }
    return false;
  }

  /**
   * Parse Resend error and throw appropriate custom error
   */
  private handleResendError(error: unknown): never {
    // Check if it's a Resend API error
    if (error && typeof error === "object" && "message" in error) {
      const apiError = error as { message: string; name?: string };

      // Check for rate limit error
      if (apiError.name === "rate_limit_exceeded" || apiError.message.includes("rate limit")) {
        throw new ResendRateLimitError(apiError.message);
      }

      // Check for validation errors
      if (apiError.name === "validation_error" || apiError.message.includes("validation")) {
        throw new ResendEmailError(apiError.message, "VALIDATION_ERROR", 400, error);
      }

      // Generic API error
      throw new ResendEmailError(apiError.message, "API_ERROR", undefined, error);
    }

    // Unknown error
    throw new ResendEmailError(
      "An unexpected error occurred while sending email",
      "UNKNOWN_ERROR",
      undefined,
      error,
    );
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    retryOptions?: RetryOptions,
  ): Promise<T> {
    const options = { ...this.retryOptions, ...retryOptions };
    let lastError: unknown;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        this.log(
          "info",
          `Attempting ${operation} (attempt ${attempt + 1}/${options.maxRetries + 1})`,
        );
        const result = await fn();
        if (attempt > 0) {
          this.log("info", `${operation} succeeded after ${attempt + 1} attempts`);
        }
        return result;
      } catch (error) {
        lastError = error;

        if (attempt === options.maxRetries || !this.isRetryableError(error)) {
          this.log("error", `${operation} failed after ${attempt + 1} attempts`, error);
          throw error;
        }

        const delay = this.calculateRetryDelay(attempt);
        this.log(
          "warn",
          `${operation} failed (attempt ${attempt + 1}), retrying in ${Math.round(delay)}ms`,
          error,
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Send contact form email with retry logic
   */
  public async sendContactFormEmail(
    data: EnhancedContactFormData,
    retryOptions?: RetryOptions,
  ): Promise<EmailResult> {
    const operation = `send contact form email from ${data.email}`;

    try {
      const result = await this.executeWithRetry(
        async () => {
          // Ensure Resend client is initialized
          await this.ensureInitialized();

          if (!this.resend) {
            throw new ResendConfigurationError("Resend client is not initialized");
          }

          const timestamp = new Date().toLocaleString("en-US", {
            timeZone: "America/Denver",
            dateStyle: "full",
            timeStyle: "long",
          });

          const emailData = ContactEmailTemplate({ ...data, timestamp });

          this.log("info", `Sending contact form email`, {
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
          });

          const { data: response, error } = await this.resend.emails.send(emailData);

          if (error) {
            this.log("error", "Resend API error", error);
            this.handleResendError(error);
          }

          if (!response?.id) {
            throw new ResendEmailError(
              "Failed to send email: No email ID returned",
              "INVALID_RESPONSE",
            );
          }

          this.log("info", `Email sent successfully with ID: ${response.id}`);
          return { id: response.id, timestamp };
        },
        operation,
        retryOptions,
      );

      return result;
    } catch (error) {
      // Log the final error
      this.log("error", `Failed to ${operation}`, error);

      // Re-throw custom errors as-is
      if (error instanceof ResendEmailError) {
        throw error;
      }

      // Wrap unknown errors
      throw new ResendEmailError(
        "Failed to send email. Please try again later.",
        "SEND_FAILED",
        undefined,
        error,
      );
    }
  }

  /**
   * Send multiple emails in batch
   */
  public async sendBatchEmails(
    emails: Array<{
      data: EnhancedContactFormData;
      retryOptions?: RetryOptions;
    }>,
    concurrency = 3,
  ): Promise<BatchEmailResult> {
    this.log("info", `Starting batch email send for ${emails.length} emails`);

    const results: BatchEmailResult = {
      successful: [],
      failed: [],
    };

    // Process emails in chunks to respect concurrency limit
    const chunks: (typeof emails)[] = [];
    for (let i = 0; i < emails.length; i += concurrency) {
      chunks.push(emails.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ data, retryOptions }) => {
        try {
          const result = await this.sendContactFormEmail(data, retryOptions);
          results.successful.push(result);
        } catch (error) {
          results.failed.push({
            email: data.email,
            error:
              error instanceof ResendEmailError
                ? error
                : new ResendEmailError("Unknown error", "UNKNOWN", undefined, error),
          });
        }
      });

      await Promise.all(promises);
    }

    this.log("info", `Batch email send completed`, {
      total: emails.length,
      successful: results.successful.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Get webhook event details (for future webhook implementation)
   */
  public async getWebhookEvent(eventId: string): Promise<unknown> {
    try {
      this.log("info", `Fetching webhook event: ${eventId}`);

      // Note: This is a placeholder for when Resend adds webhook event retrieval
      // For now, we'll just return a mock response
      this.log("warn", "Webhook event retrieval not yet implemented by Resend API");

      return {
        id: eventId,
        status: "pending",
        message: "Webhook event retrieval not yet implemented",
      };
    } catch (error) {
      this.log("error", `Failed to fetch webhook event ${eventId}`, error);
      throw new ResendEmailError(
        "Failed to fetch webhook event",
        "WEBHOOK_ERROR",
        undefined,
        error,
      );
    }
  }

  /**
   * Validate webhook signature (for future webhook implementation)
   */
  public validateWebhookSignature(_payload: string, _signature: string, _secret: string): boolean {
    try {
      // Note: This is a placeholder for webhook signature validation
      // Implementation will depend on Resend's webhook signature scheme
      this.log("warn", "Webhook signature validation not yet implemented");

      // For now, return true in development, false in production
      return process.env.NODE_ENV === "development";
    } catch (error) {
      this.log("error", "Failed to validate webhook signature", error);
      return false;
    }
  }

  /**
   * Send a test email (useful for development/testing)
   */
  public async sendTestEmail(retryOptions?: RetryOptions): Promise<EmailResult> {
    const testData: EnhancedContactFormData = {
      name: "Test User",
      email: "test@example.com",
      message: "This is a test message from the contact form.",
      honeypot: "",
      gdprConsent: true,
    };

    this.log("info", "Sending test email");
    return this.sendContactFormEmail(testData, retryOptions);
  }

  /**
   * Verify the Resend configuration
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      this.log("info", "Verifying Resend configuration");

      // Ensure Resend client is initialized
      await this.ensureInitialized();

      if (!this.resend) {
        this.log("error", "Resend client is not initialized");
        return false;
      }

      // Attempt to send a test email to verify configuration
      const testEmail = {
        from: env.RESEND_FROM_EMAIL || "no-reply@bjornmelin.io",
        to: env.CONTACT_EMAIL || "bjornmelin16@gmail.com",
        subject: "Resend Configuration Test",
        text: "This is a test email to verify Resend configuration.",
      };

      const { error } = await this.resend.emails.send(testEmail);

      if (error) {
        this.log("error", "Resend configuration error", error);
        return false;
      }

      this.log("info", "Resend configuration verified successfully");
      return true;
    } catch (error) {
      this.log("error", "Failed to verify Resend configuration", error);
      return false;
    }
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{
    healthy: boolean;
    version: string;
    configuration: {
      fromEmail: string;
      contactEmail: string;
      retryOptions: RetryOptions;
    };
    lastError?: string;
  }> {
    try {
      const configValid = await this.verifyConfiguration();

      return {
        healthy: configValid,
        version: "2.0.0", // Enhanced version
        configuration: {
          fromEmail: env.RESEND_FROM_EMAIL || "no-reply@bjornmelin.io",
          contactEmail: env.CONTACT_EMAIL || "bjornmelin16@gmail.com",
          retryOptions: this.retryOptions,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        version: "2.0.0",
        configuration: {
          fromEmail: env.RESEND_FROM_EMAIL || "no-reply@bjornmelin.io",
          contactEmail: env.CONTACT_EMAIL || "bjornmelin16@gmail.com",
          retryOptions: this.retryOptions,
        },
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
