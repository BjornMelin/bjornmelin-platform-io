# CSRF Protection Implementation

## Overview

This implementation provides comprehensive CSRF (Cross-Site Request Forgery) protection for the Next.js 15 App Router application using the double-submit cookie pattern with the `@edge-csrf/nextjs` package.

## Architecture

### Components

1. **Middleware** (`src/middleware.ts`)
   - Applies CSRF protection to all API routes
   - Generates and validates CSRF tokens
   - Configurable token expiry (1 hour default)
   - Excludes GET, HEAD, OPTIONS requests
   - Skips Server Actions (already protected by Next.js)

2. **CSRF Provider** (`src/components/providers/csrf-provider.tsx`)
   - Client-side context provider for CSRF tokens
   - Automatic token fetching on mount
   - Token refresh every 45 minutes
   - Error handling and loading states

3. **Security Utilities** (`src/lib/utils/security.ts`)
   - Server-side CSRF token validation helpers
   - Token generation and comparison functions
   - Header extraction utilities

4. **CSRF Endpoint** (`src/app/api/csrf/route.ts`)
   - GET endpoint for retrieving CSRF tokens
   - No-cache headers to prevent stale tokens

## Implementation Details

### Token Flow

1. **Initial Token Generation**
   - Middleware generates token on first request
   - Token stored in httpOnly cookie (`_csrf`)
   - Token also sent via `X-CSRF-Token` header

2. **Client-Side Token Retrieval**
   - CSRFProvider fetches token on mount
   - GET request to `/api/csrf` endpoint
   - Token stored in React context

3. **Protected Request Flow**
   - Client includes token in `X-CSRF-Token` header
   - Middleware validates token against cookie
   - Request rejected if tokens don't match

### Security Features

- **HttpOnly Cookies**: CSRF cookie cannot be accessed via JavaScript
- **SameSite=Lax**: Cookie only sent with same-site requests
- **Secure Flag**: Cookie only sent over HTTPS in production
- **Token Expiry**: Tokens expire after 1 hour
- **Timing-Safe Comparison**: Prevents timing attacks

## Usage

### In Forms

```tsx
import { useCSRFHeaders } from "@/components/providers/csrf-provider";

function MyForm() {
  const csrfHeaders = useCSRFHeaders();
  
  const handleSubmit = async (data) => {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: csrfHeaders,
      body: JSON.stringify(data),
      credentials: "same-origin",
    });
  };
}
```

### In Server Components

```tsx
import { getCSRFToken } from "@/lib/utils/security";

export default async function Page() {
  const csrfToken = await getCSRFToken();
  
  return (
    <form action="/api/form-handler" method="post">
      <input type="hidden" name="csrf_token" value={csrfToken || ""} />
    </form>
  );
}
```

### Manual Validation

```ts
import { validateCSRFFromHeaders } from "@/lib/utils/security";

export async function POST(request: Request) {
  // Manual CSRF validation (if needed)
  const isValid = await validateCSRFFromHeaders(request);
  if (!isValid) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  
  // Process request...
}
```

## Configuration

### Middleware Configuration

```ts
const csrfProtect = createCsrfMiddleware({
  cookie: {
    name: "_csrf",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
  tokenExpiryMs: 60 * 60 * 1000, // 1 hour
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  excludePathPrefixes: ["/_next/", "/api/health"],
});
```

### Excluded Paths

The following paths are excluded from CSRF protection:
- `/_next/` - Next.js internal routes
- `/api/health` - Health check endpoints
- `/api/metrics` - Metrics endpoints
- Static assets (images, fonts, etc.)

## Testing

### Unit Tests

```bash
pnpm test src/lib/utils/__tests__/csrf.test.ts
```

### E2E Tests

CSRF protection is tested in the contact form E2E tests:
```bash
pnpm test:e2e e2e/contact/security-features.spec.ts
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**
   - Ensure CSRFProvider is wrapping your components
   - Check that credentials: "same-origin" is set
   - Verify middleware is running (check logs)

2. **Token Not Found**
   - Ensure `/api/csrf` endpoint is accessible
   - Check browser network tab for CSRF requests
   - Verify middleware configuration

3. **Token Mismatch**
   - Clear browser cookies and retry
   - Check for multiple CSRF cookies
   - Ensure consistent domain/subdomain

### Debug Mode

Enable debug logging:
```ts
// In middleware.ts
console.log("CSRF Token:", request.headers.get("X-CSRF-Token"));
console.log("CSRF Cookie:", request.cookies.get("_csrf"));
```

## Security Considerations

1. **Server Actions**: Already protected by Next.js origin verification
2. **API Routes**: Protected by this implementation
3. **Static Routes**: Not protected (no side effects)
4. **GET Requests**: Not protected (should be idempotent)

## Future Enhancements

1. **Rotating Tokens**: Implement token rotation on each request
2. **Per-Form Tokens**: Generate unique tokens per form
3. **Redis Storage**: Store tokens in Redis for horizontal scaling
4. **Custom Error Pages**: Dedicated CSRF error page

## References

- [OWASP CSRF Prevention](https://owasp.org/www-community/attacks/csrf)
- [Next.js Security Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)
- [@edge-csrf/nextjs Documentation](https://www.npmjs.com/package/@edge-csrf/nextjs)