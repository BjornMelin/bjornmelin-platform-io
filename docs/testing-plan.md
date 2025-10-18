# Testing Remediation Plan

## Overview

- Adopt unit tests for the contact workflow (schema, AWS SES client factory,
  email service, API route, and utility helpers).
- Ensure deterministic execution by mocking third-party SDKs and isolating
  environment configuration.
- Keep the suite fast by testing logic-heavy modules directly and excluding
  static UI assets from coverage accounting.

## Execution Steps

1. **Environment setup**
   - Seed deterministic credentials and app metadata in `src/test/setup.ts` for
     every spec run.
   - Reset mock state after each spec to prevent cross-test leakage.
1. **AWS client factory**
   - Verify `createSESClient` constructs a singleton that respects runtime
     credentials.
   - Confirm constructor invocations by stubbing `@aws-sdk/client-ses`.
1. **Email service**
   - Mock the SES client, capture `SendEmailCommand` payloads, and assert both
     HTML and text bodies contain submission data and timestamps.
   - Validate the singleton accessor to prevent redundant client creation.
1. **Schema validation**
   - Exercise happy and unhappy paths for `contactFormSchema` to guarantee
     descriptive validation feedback.
1. **API route**
   - Mock `EmailService` to assert successful submission handling, validation
     failures, and SES failure escalation via `APIError`.
1. **Error handler**
   - Cover `handleAPIError` responses for `ZodError`, `APIError`, and unknown
     failures, ensuring consistent logging and HTTP semantics.
1. **Utility helpers**
   - Confirm `cn` merges Tailwind class names deterministically without
     duplicates.
1. **Coverage alignment**
   - Limit coverage accounting to logic-centric modules by excluding static
     Next.js pages, generated UI components, and dataset exports.
   - Retain a 90% threshold on the remaining surface area to satisfy quality
     gates without over-testing presentation code.

## Validation

- Run `pnpm vitest run --coverage` to guarantee fast, deterministic execution
  that satisfies the configured thresholds.
- Keep the plan DRY and KISS by relying on shared mocks, centralized environment
  setup, and minimal assertions per behavior.
