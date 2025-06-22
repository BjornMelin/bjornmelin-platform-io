# Backend Architecture

The backend architecture is primarily serverless, utilizing Next.js API routes and AWS services.

## API Routes

Located in `src/app/api/`:

```
api/
└── contact/
    └── route.ts    # Contact form endpoint
```

## Services

### Email Service

- Implementation: `src/lib/services/resend-email.ts`
- Uses Resend API for email delivery
- Handles contact form submissions
- Features:
  - TypeScript-native SDK
  - Built-in retry mechanisms
  - Real-time analytics
  - Webhook support

### Error Handling

- Centralized error handling in `src/lib/utils/error-handler.ts`
- Consistent error responses across API endpoints

## Data Validation

### Schema Validation

- Located in `src/lib/schemas/`
- Uses Zod for runtime type checking
- Validates incoming API requests

Example contact form schema:

```typescript
contact.ts:
- name validation
- email format validation
- message length requirements
```

## External Services

### Resend Email API

- Modern email delivery service
- No infrastructure management required
- Simple API key configuration
- Automatic bounce and complaint handling

## AWS Integration

### Infrastructure

- Serverless architecture
- CDK for infrastructure management
- Environment isolation

## Security

### Request Validation

- Input sanitization
- Rate limiting
- CORS configuration

### Environment Variables

- Secure configuration management
- Environment-specific settings
- Type-safe through `env.mjs`

## Monitoring

### Error Tracking

- Error logging
- AWS CloudWatch integration
- Performance monitoring

### Logging

- Structured logging format
- Environment-based log levels
- AWS CloudWatch logs

## Development

### Local Development

- Environment setup instructions in `development/getting-started.md`
- Local AWS credential configuration
- Environment variable management

### Testing

- API endpoint testing
- Service unit tests
- Infrastructure testing through CDK
