# Contact Form API

The contact form API handles submission of contact form messages.

## Endpoint

`POST /api/contact`

## Request Schema

```typescript
{
  name: string; // Full name of the sender
  email: string; // Email address of the sender
  message: string; // Message content
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

## Implementation Details

The contact form endpoint uses AWS SES (Simple Email Service) to send emails.
The implementation can be found in:

- `src/app/api/contact/route.ts` - API route handler
- `src/lib/services/email.ts` - Email service implementation
- `src/lib/schemas/contact.ts` - Request validation schema
