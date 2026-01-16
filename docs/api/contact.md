# Contact Form API

The contact form API handles submission of contact form messages.

## Endpoint

`POST /api/contact`

## Request Schema

```typescript
{
  name: string;    // 2-50 characters
  email: string;   // Valid email format
  message: string; // 10-1000 characters
  honeypot?: string; // Must be empty (bot detection)
  formLoadTime?: number; // Timestamp (ms) when form loaded
}
```

### Validation Rules

| Field | Type | Constraints |
| ------- | ------ | ------------- |
| `name` | string | Required, 2-50 characters |
| `email` | string | Required, valid email format |
| `message` | string | Required, 10-1000 characters |
| `honeypot` | string | Optional, must be empty |
| `formLoadTime` | number | Optional, used for timing checks |

## Response

### Success Response (200)

```json
{
  "success": true
}
```

### Error Responses

**Validation Error (400)**:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Error description"
    }
  ]
}
```

**Invalid JSON (400)**:

```json
{
  "error": "Validation failed",
  "code": "INVALID_JSON"
}
```

**Rate Limited (429)**:

```json
{
  "error": "Too many requests. Please try again later."
}
```

**Email Send Error (500)**:

```json
{
  "error": "Failed to send message. Please try again later.",
  "code": "EMAIL_SEND_ERROR"
}
```

**Internal Error (500)**:

```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_SERVER_ERROR"
}
```

## Implementation Details

The contact form endpoint uses Resend for email delivery with built-in abuse prevention:

- **Rate Limiting**: 5 requests per minute per IP
- **Honeypot Field**: Hidden field to catch bots
- **Time-based Validation**: Rejects submissions faster than 3 seconds

Honeypot submissions return a success response without sending email.

The implementation can be found in:

- `src/app/api/contact/route.ts` - API route handler
- `src/lib/email/` - Email service implementation (Resend)
- `src/lib/security/` - Rate limiting, honeypot, and time checks
- `src/lib/schemas/contact.ts` - Request validation schema

## Example Request

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, I would like to get in touch."
  }'
```
