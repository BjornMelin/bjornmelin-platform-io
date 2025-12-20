# API Documentation

API endpoints available in bjornmelin-platform-io.

Note: With `output: 'export'` in next.config.mjs, API routes are only available
during local development. In production, the contact form is handled by an
AWS Lambda function deployed via CDK infrastructure.

## Available Endpoints

- [Contact Form](./contact.md) - Endpoint for handling contact form submissions

## API Structure

The API is implemented using Next.js API routes located in `src/app/api/`:

```text
src/app/api/
└── contact/
    └── route.ts    # Contact form handler
```

## Common Patterns

### Request Format

All API endpoints accept JSON-formatted request bodies.

### Response Format

Success response:

```json
{
  "success": true
}
```

Error response:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_JSON` | Request body is not valid JSON |
| `VALIDATION_ERROR` | Request body failed schema validation |
| `EMAIL_SEND_ERROR` | Failed to send email via SES |

## Development

### Local Testing

The API can be tested locally using the development server:

```bash
pnpm dev
```

API endpoints will be available at `http://localhost:3000/api/`

### API Testing Tools

- Thunder Client
- Postman
- cURL commands

## Security

- Input validation using Zod schema
- Request size limits (Next.js defaults)

## Service Dependencies

The API relies on:

- AWS SES for email sending
- Environment variables for configuration (see [schemas.md](./schemas.md))
- Zod for request validation

For detailed information about specific endpoints, refer to the individual
documentation pages linked above.
