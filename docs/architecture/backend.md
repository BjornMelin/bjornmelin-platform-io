# Backend Architecture

The backend architecture is primarily serverless, using Next.js API routes and
AWS services.

## API Routes

Located in `src/app/api/`:

```text
api/
└── contact/
    └── route.ts    # Contact form endpoint
```

## Services

### Email Service

- Implementation: `src/lib/email/`
- Uses Resend for email delivery
- Handles contact form submissions

### Security Services

- Rate limiting: `src/lib/security/rate-limiter.ts`
- Honeypot detection: `src/lib/security/honeypot.ts`
- Time-based validation: `src/lib/security/time-check.ts`

### Error Handling

- Centralized error handling in `src/lib/utils/error-handler.ts`
- Consistent error responses across API endpoints

## Data Validation

### Schema Validation

- Located in `src/lib/schemas/`
- Uses Zod v4 for runtime type checking
- Validates incoming API requests

Example contact form schema:

```typescript
contact.ts:
- name validation
- email format validation
- message length requirements
- honeypot field (optional, must be empty)
- formLoadTime (optional, for timing validation)
```

## Email Integration

### Resend Configuration

- Email sending capabilities via Resend API
- API key stored in AWS SSM Parameter Store
- Lambda function reads API key at runtime

### Infrastructure

- Serverless architecture
- CDK for infrastructure management
- Environment isolation

## Security

### Request Validation

- Input sanitization
- Rate limiting (5 requests/minute per IP)
- Honeypot fields for bot detection
- Time-based validation (3 second minimum)
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
- Local Resend API key configuration
- Environment variable management

### Testing

- API endpoint testing
- Service unit tests
- Infrastructure testing through CDK
