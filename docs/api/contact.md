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
}
```

### Validation Rules

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | Required, 2-50 characters |
| `email` | string | Required, valid email format |
| `message` | string | Required, 10-1000 characters |

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
  "code": "INVALID_JSON"
}
```

**Email Send Error (500)**:

```json
{
  "error": "Failed to send message. Please try again later.",
  "code": "EMAIL_SEND_ERROR"
}
```

## Implementation Details

The contact form endpoint uses AWS SES (Simple Email Service) to send emails.
The implementation can be found in:

- `src/app/api/contact/route.ts` - API route handler
- `src/lib/services/email.ts` - Email service implementation
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
