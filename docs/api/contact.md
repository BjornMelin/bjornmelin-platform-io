# Contact Form API

The contact form API handles submission of contact form messages with built-in security features.

## Endpoint

`POST /api/contact`

## Request Schema

```typescript
{
  name: string;       // Full name (2-100 chars, letters/spaces/hyphens/apostrophes only)
  email: string;      // Valid email address
  message: string;    // Message content (10-1000 chars)
  honeypot?: string;  // Anti-bot field (must be empty)
  gdprConsent: boolean; // GDPR consent (must be true)
}
```

## Response

### Success Response

```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Security Features

- **Rate Limiting**: 5 requests per 5 minutes per IP address
- **Honeypot Protection**: Hidden field to catch bots
- **Input Sanitization**: XSS prevention on all text inputs
- **GDPR Compliance**: Requires explicit consent
- **Validation**: Strict schema validation with Zod

## Rate Limit Headers

The API returns rate limit information in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed (5)
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Error Codes

- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_REQUEST`: Malformed request body
- `EMAIL_SEND_ERROR`: Failed to send email

## Implementation Details

The contact form endpoint uses Resend API for reliable email delivery. The implementation can be found in:

- `src/app/api/contact/route.ts` - API route handler
- `src/lib/services/resend-email.ts` - Resend email service implementation
- `src/lib/schemas/contact.ts` - Request validation schema
- `src/lib/utils/security.ts` - Security utilities (rate limiting, sanitization)
