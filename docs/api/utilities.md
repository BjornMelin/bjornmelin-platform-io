# Utility Services Documentation

This document describes the utility services used throughout the API implementation.

## Error Handler (`error-handler.ts`)

The error handler provides centralized error management for API routes.

### `APIError` Class

Custom error class for API-specific errors:

```typescript
class APIError extends Error {
  constructor(
    message: string,
    statusCode: number = 500,
    code?: string
  )
}
```

### `handleAPIError` Function

Standardizes error responses across all API endpoints:

```typescript
function handleAPIError(error: unknown): NextResponse
```

Returns JSON response with appropriate status code and error details.

## Security Utilities (`security.ts`)

Provides security features for the application.

### Rate Limiting

```typescript
interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  max?: number;         // Legacy field for max requests
}

function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}
```

Default configuration: 5 requests per 15 minutes per IP address.

### CSRF Token Management

```typescript
function generateCSRFToken(): string
function validateCSRFToken(token: string, sessionToken: string): boolean
function verifyCSRFToken(token: string, sessionToken: string): boolean // Alias for validateCSRFToken
```

### Input Sanitization

```typescript
function sanitizeInput(input: string): string
```

Removes HTML tags, script content, JavaScript protocols, and event handlers.

### IP Address Detection

```typescript
function getClientIp(request: Request): string
```

Extracts client IP from various headers (CloudFlare, forwarded, real IP).

## Parameter Store (`parameter-store.ts`)

Manages secure access to configuration parameters.

### Environment Variables

The parameter store validates and provides access to:

- `RESEND_API_KEY`: API key for Resend email service
- `RESEND_FROM_EMAIL`: Sender email address
- `RESEND_TO_EMAIL`: Recipient email address

### `ParameterStore` Class

Singleton class that:
- Validates required environment variables on initialization
- Provides type-safe access to parameters
- Throws `ParameterStoreError` if required parameters are missing

## Resend Email Service (`resend-email.ts`)

Handles email delivery using the Resend API.

### `ResendEmailService` Class

Singleton service for sending emails:

```typescript
class ResendEmailService {
  static getInstance(): ResendEmailService
  
  async sendContactFormEmail(data: ContactFormData): Promise<{
    id: string;
    from: string;
    to: string;
    created_at: string;
  }>
}
```

### Error Classes

- `ResendEmailError`: Base error class for Resend operations
- `ResendRateLimitError`: Thrown when Resend API rate limit is exceeded

### Email Template

Contact form emails are sent with:
- HTML formatting with professional design
- All form fields displayed clearly
- Timestamp and metadata included
- Responsive email template

## Environment Configuration

Required environment variables:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_TO_EMAIL=contact@yourdomain.com
```

## Security Considerations

1. **Rate Limiting**: In-memory store for development; use Redis for production
2. **CSRF Tokens**: Generate unique tokens per session
3. **Input Sanitization**: Always sanitize user input before processing
4. **IP Detection**: Handles various proxy configurations
5. **Parameter Security**: Never expose API keys in responses

## Testing Utilities

All utilities include comprehensive test coverage:
- Unit tests for individual functions
- Integration tests for service interactions
- Mock implementations for external services