# API Documentation

This section covers the API endpoints available in bjornmelin-platform-io.

## Available Endpoints

Currently, the platform provides the following API endpoint:

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

All API endpoints return JSON responses with the following structure:

```typescript
// Success response
{
  "success": true,
  "data": any       // Response data if applicable
}

// Error response
{
  "success": false,
  "error": string   // Error message
}
```

### Error Handling

- Input validation errors
- Service availability errors
- Rate limiting errors

## Development

### Local Testing

The API can be tested locally using the development server:

```bash
yarn dev
```

API endpoints will be available at `http://localhost:3000/api/`

### API Testing Tools

- Thunder Client
- Postman
- cURL commands

## Security

- Input validation using Zod
- Rate limiting
- CORS configuration
- Request size limits

## Service Dependencies

The API relies on:

- AWS SES for email sending
- Environment variables for configuration
- Type-safe request/response handling

For detailed information about specific endpoints, refer to the individual
documentation pages linked above.
