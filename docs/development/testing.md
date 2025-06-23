# Testing Documentation

## Overview

This project implements comprehensive testing strategies including unit tests, integration tests, and end-to-end tests to ensure code quality and reliability.

## Test Stack

- **Unit/Integration Tests**: Vitest + Testing Library
- **E2E Tests**: Playwright
- **Code Coverage**: Vitest Coverage (V8)
- **Linting**: Biome
- **Type Checking**: TypeScript

## Running Tests

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- Docker (for E2E tests locally)

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### E2E Tests

Due to Playwright's system dependencies, E2E tests must run in Docker or CI environment.

#### Using Docker (Recommended for Local Development)

```bash
# Quick run with Docker script
pnpm test:e2e:docker

# Or using docker-compose with volume mounts for reports
docker-compose -f docker-compose.e2e.yml up --build

# View test reports after run
open playwright-report/index.html
```

#### Using GitHub Actions (Automated)

E2E tests run automatically on:
- Pull requests to main branch
- Pushes to main or develop branches

View results in the Actions tab of the GitHub repository.

## Test Structure

### Unit Tests

Located alongside source files with `.test.ts` or `.test.tsx` extensions:

```
src/
├── components/
│   └── contact/
│       ├── contact-form-enhanced.tsx
│       └── __tests__/
│           └── contact-form-enhanced.test.tsx
├── lib/
│   ├── validation/
│   │   ├── contact-schema.ts
│   │   └── __tests__/
│   │       └── contact-schema.test.ts
│   └── utils/
│       ├── error-handler.ts
│       └── __tests__/
│           └── error-handler.test.ts
└── app/
    └── api/
        └── contact/
            └── __tests__/
                ├── route.test.ts
                └── integration.test.ts
```

### E2E Tests

Organized by feature in the `e2e/` directory:

```
e2e/
├── fixtures/          # Page Object Models
│   └── contact-page.ts
└── contact/          # Contact form tests
    ├── contact-form.spec.ts
    ├── rate-limiting.spec.ts
    ├── security-features.spec.ts
    └── validation-errors.spec.ts
```

## Test Configuration

### Vitest Configuration

Tests run in a jsdom environment with the following setup:

- **Environment**: jsdom (for DOM testing)
- **Setup File**: `src/test/setup.ts`
- **Coverage Thresholds**: 90% for lines, functions, branches, and statements
- **Globals**: Enabled for describe, it, expect

### Test Setup

The `src/test/setup.ts` file configures:
- Testing Library DOM matchers
- Browser API mocks (matchMedia, IntersectionObserver, ResizeObserver)
- Crypto API mock for CSRF token generation
- Automatic cleanup after each test

## Test Coverage Goals

- **Unit Tests**: ~90% coverage for business logic
- **E2E Tests**: Critical user paths and security features

Current coverage focuses on:
- Contact form validation and submission
- Security utilities (rate limiting, CSRF protection)
- Error handling and user feedback
- Accessibility compliance

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactFormEnhanced } from "../contact-form-enhanced";

describe("ContactFormEnhanced", () => {
  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<ContactFormEnhanced />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "invalid-email");
    await user.tab();
    
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";
import { ContactPage } from "../fixtures/contact-page";

test("should submit contact form successfully", async ({ page }) => {
  const contactPage = new ContactPage(page);
  await contactPage.goto();
  
  await contactPage.fillForm({
    name: "John Doe",
    email: "john@example.com",
    message: "Test message",
    acceptGdpr: true
  });
  
  await contactPage.submit();
  
  const toast = await contactPage.getToastMessage();
  expect(toast.title).toBe("Message sent successfully!");
});
```

## Page Object Model

E2E tests use the Page Object Model pattern for maintainability:

```typescript
export class ContactPage {
  constructor(private page: Page) {}
  
  async fillForm(data: ContactFormData) {
    await this.page.getByLabel("Name").fill(data.name);
    await this.page.getByLabel("Email").fill(data.email);
    await this.page.getByLabel("Message").fill(data.message);
    if (data.acceptGdpr) {
      await this.page.getByRole("checkbox").check();
    }
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

E2E tests run automatically in CI with:
- Playwright browsers pre-installed
- Test artifacts uploaded on failure
- Parallel test execution
- Automatic retries for flaky tests

See `.github/workflows/e2e-tests.yml` for configuration.

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
pnpm test src/components/contact/__tests__/contact-form-enhanced.test.tsx

# Run tests matching pattern
pnpm test -- -t "validation"

# Debug with UI
pnpm test:ui
```

### E2E Tests

```bash
# Run in headed mode (requires display)
pnpm test:e2e --headed

# Debug specific test
pnpm test:e2e --debug contact-form.spec.ts

# Generate trace for debugging
pnpm test:e2e --trace on
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Naming**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Services**: Use vi.mock() for API mocking
5. **Test User Behavior**: Focus on user interactions, not implementation
6. **Accessibility**: Include a11y tests in E2E suite

## Common Issues

### E2E Tests Won't Run Locally

**Problem**: Missing system dependencies for Playwright

**Solution**: Use Docker or install dependencies:
```bash
# Use the provided Docker script
pnpm test:e2e:docker

# Or setup E2E environment (installs Playwright browsers)
pnpm test:e2e:setup
```

### Flaky Tests

**Problem**: Tests pass/fail inconsistently

**Solution**: 
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use test retries in playwright.config.ts
- Check for race conditions in async code

### Coverage Not Meeting Target

**Problem**: Coverage below 90% threshold

**Solution**:
- Run `pnpm test:coverage` to identify gaps
- Focus on testing business logic, not UI details
- Add edge cases and error scenarios

## Feature Flag Testing

Tests can use feature flags to test different behaviors:

```typescript
import { describe, it, expect, vi } from "vitest";
import { evaluateFlag } from "@/lib/feature-flags/evaluator";

vi.mock("@/lib/feature-flags/evaluator", () => ({
  evaluateFlag: vi.fn().mockResolvedValue(true)
}));

describe("Feature with flag", () => {
  it("should show enhanced feature when flag is enabled", async () => {
    // Test with feature enabled
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)