# API Documentation

API endpoints available in bjornmelin-platform-io.

Note: This site is deployed as a pure static export (`output: "export"`). API
requests are handled by AWS Lambda behind CloudFront.

## Available Endpoints

- [Contact Form](./contact.md) - Endpoint for handling contact form submissions

## API Structure

- The UI posts to `${NEXT_PUBLIC_API_URL}/contact`.
- In production, CloudFront routes `/api/*` to Lambda (see `infrastructure/`).
- In local development, set `NEXT_PUBLIC_API_URL` to your deployed API Gateway/Lambda base URL.

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
| ------ | ------------- |
| `INVALID_JSON` | Request body is not valid JSON |
| `VALIDATION_ERROR` | Request body failed schema validation |
| `EMAIL_SEND_ERROR` | Failed to send email via Resend |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Development

### Local Testing

The site can be run locally with:

```bash
pnpm dev
```

### API Testing Tools

- Thunder Client
- Postman
- cURL commands

## Security

- Input validation using Zod schema
- Request size limits and rate limiting are enforced in the Lambda handler (infrastructure).

## Service Dependencies

The API relies on:

- Resend for email sending
- Environment variables for configuration (see [schemas.md](./schemas.md))
- Zod for request validation

For detailed information about specific endpoints, refer to the individual
documentation pages linked above.
