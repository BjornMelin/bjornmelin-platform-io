# Testing Strategies

## Testing Framework

### Core Tools

- Vitest (unit testing)
- Playwright (E2E testing)
- React Testing Library
- TypeScript
- MSW (Mock Service Worker)

## Test Types

### 1. Component Testing

- UI components
- Server Components
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

## Component Testing

### React Components

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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

```typescript
import { Contact } from "@/app/contact/page";

describe("Contact Page", () => {
  it("renders contact form", () => {
    render(<Contact />);
    expect(screen.getByRole("form")).toBeInTheDocument();
  });
});
```

## API Testing

### Contact Form API

```typescript
import { POST } from "@/app/api/contact/route";

describe("Contact API", () => {
  it("handles valid submission", async () => {
    const response = await POST(
      new Request("api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Test message",
        }),
      })
    );

    expect(response.status).toBe(200);
  });

  it("validates input", async () => {
    const response = await POST(
      new Request("api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "",
          email: "invalid",
          message: "",
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
```

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

## Test Organization

### Directory Structure

```
src/
├── __tests__/
│   ├── components/
│   ├── api/
│   └── integration/
├── e2e/              # Playwright E2E tests
│   ├── contact.spec.ts
│   └── navigation.spec.ts
└── test-utils/
    ├── setup.ts
    └── helpers.ts
```

### Naming Conventions

- `ComponentName.test.tsx` - Component tests
- `route.test.ts` - API route tests
- `flow.test.tsx` - Integration tests

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
- Use Zod schemas for validation testing

### 3. Coverage Goals

- Components: 80%
- API Routes: 90%
- Utility Functions: 100%
- E2E Critical Paths: 100%

### 4. Performance

- Optimize test execution with Vitest
- Proper mocking strategies
- Avoid unnecessary rerenders
- Parallel test execution

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test ComponentName.test.tsx

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage

# Run E2E tests with Playwright
pnpm test:e2e
```

## Continuous Integration

Tests are run automatically on:

- Pull requests
- Main branch commits
- Release tags

For more detailed testing examples and patterns, refer to the test files in the codebase.
