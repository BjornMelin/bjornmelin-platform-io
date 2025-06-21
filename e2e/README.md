# E2E Tests with Playwright

This directory contains end-to-end tests for the platform using Playwright.

## Setup

1. Install Playwright browsers:
```bash
pnpm exec playwright install chromium
```

2. Install system dependencies (if needed):
```bash
sudo pnpm exec playwright install-deps
```

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode
pnpm test:e2e:ui

# Run a specific test file
pnpm test:e2e e2e/contact/contact-form.spec.ts

# View test report
pnpm test:e2e:report
```

## Test Structure

- `fixtures/` - Page objects and shared test utilities
- `contact/` - Contact form E2E tests
  - `contact-form.spec.ts` - Happy path tests
  - `rate-limiting.spec.ts` - Rate limiting verification
  - `security-features.spec.ts` - Security feature tests
  - `validation-errors.spec.ts` - Form validation tests

## Writing Tests

Tests use the Page Object Model pattern:

```typescript
import { test, expect } from "@playwright/test";
import { ContactPage } from "../fixtures/contact-page";

test("test name", async ({ page }) => {
  const contactPage = new ContactPage(page);
  await contactPage.goto();
  // ... test implementation
});
```

## CI/CD Integration

The E2E tests are configured to run on CI with:
- Automatic retries on failure
- Screenshot and video capture on failure
- HTML report generation

## Notes

- The tests run against `http://localhost:3000` by default
- The dev server is automatically started before tests
- Only Chromium is enabled for the minimal test suite
- Additional browsers can be enabled in `playwright.config.ts`