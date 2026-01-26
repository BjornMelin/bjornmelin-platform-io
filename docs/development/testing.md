# Testing Strategies

## Testing Framework

### Core Tools

- React Testing Library
- Vitest
- TypeScript
- MSW (Mock Service Worker)
- Playwright (E2E)

## Test Types

### 1. Component Testing

- UI components
- Client Components
- Custom Hooks

### 2. API Testing

- Next.js API Routes
- External Services Integration
- Error Handling

### 3. Integration Testing

- Page Flows
- Form Submissions
- Data Fetching

### 4. End-to-End (E2E) Testing

- Route navigation
- Cross-page flows
- Browser-only behaviors

## Component Testing

### React Components

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    screen.getByText("Click me").click();
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Server Components

Vitest does not support async Server Components. For async Server Components,
use Playwright E2E tests instead.

## API Testing

This application is deployed as a static export. API behavior should be tested via:

- Component + integration tests using MSW to mock the contact endpoint (`*/contact`).
- Playwright E2E tests against a running dev server and/or deployed API.

## Integration Testing

### Form Submission Flow

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContactForm } from "@/components/contact/contact-form";

describe("Contact Form Flow", () => {
  it("submits form successfully", async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Test User" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Test message" },
    });

    fireEvent.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(screen.getByText("Message sent successfully")).toBeInTheDocument();
    });
  });
});
```

## End-to-End Testing (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("navigates to the about page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

### E2E runtime modes

- `PLAYWRIGHT_SERVER_MODE=dev` (default local) runs `next dev` with a single worker for stability.
- `PLAYWRIGHT_SERVER_MODE=static` (default on CI) serves `out/` via `bun run start` for faster, production-like runs.
- `PLAYWRIGHT_SERVER_MODE=none` skips the local server and uses `PLAYWRIGHT_BASE_URL`.

When using `static`, run `bun run build` first (CI already does this). You can tune parallelism with
`PLAYWRIGHT_WORKERS` and enable traces/videos locally with `PLAYWRIGHT_DEBUG_ARTIFACTS=true`.
Set `PLAYWRIGHT_SKIP_IMAGE_VARIANTS=false` to regenerate image variants during Playwright dev runs.

## Test Organization

### Directory Structure

```text
src/
├── __tests__/
│   ├── components/
│   ├── api/
│   └── integration/
└── test-utils/
    ├── setup.ts
    └── helpers.ts

e2e/
├── smoke.spec.ts
└── navigation.spec.ts
```

### Naming Conventions

- `ComponentName.test.tsx` - Component tests
- `route.test.ts` - API route tests
- `flow.test.tsx` - Integration tests
- `*.spec.ts` - Playwright E2E tests

## Best Practices

### 1. Test Organization

- Group related tests
- Clear test descriptions
- Proper setup and cleanup

### 2. Testing Principles

- Test behavior, not implementation
- Write maintainable tests
- Handle async operations properly
- Mock external services

### 3. Coverage Goals

- Components: 80%
- API Routes: 90%
- Utility Functions: 100%

### 4. Performance

- Optimize test execution
- Proper mocking strategies
- Avoid unnecessary rerenders

## Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun run test -- ComponentName.test.tsx

# Run tests in watch mode
bun run test -- --watch

# Run tests with coverage
bun run test:coverage

# Note: bun run test -- --coverage is an equivalent alias for bun run test:coverage.

# Run E2E tests
bun run test:e2e

# Run E2E tests fast (production-like build + static server)
bun run test:e2e:fast

# Run E2E tests against a static export (fast, production-like)
bun run build
PLAYWRIGHT_SERVER_MODE=static PLAYWRIGHT_WORKERS=50% bun run test:e2e
```

## Continuous Integration

Tests are run automatically on:

- Pull requests
- Main branch commits
- Release tags

For more detailed testing examples and patterns, refer to the test files in the codebase.
