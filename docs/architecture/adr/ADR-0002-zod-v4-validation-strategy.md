---
ADR: 0002
Title: Zod v4 validation strategy
Status: Implemented
Version: 1.0
Date: 2026-01-16
Supersedes: []
Superseded-by: []
Related: ["ADR-0003", "ADR-0004"]
Tags: ["architecture", "validation", "zod"]
References:
  - "[Zod v4 documentation](https://zod.dev/v4)"
  - "[Zod v4 changelog](https://zod.dev/v4/changelog)"
---

## Status

Implemented (2026-01-16).

## Description

Standardize on Zod v4 APIs and schema organization to improve runtime safety,
type inference, and security defaults across forms, API handlers, and static datasets.

## Context

The codebase uses Zod for runtime validation of API input, environment variables,
and static datasets. Zod v4 introduces top-level validators (for better tree-shaking)
and explicit object strictness helpers.

## Decision Drivers

- Reduce ambiguity around unknown keys (security and correctness).
- Keep schemas centralized, typed, and easy to reuse across app and infrastructure code.
- Prefer Zod v4 top-level validators for consistency and future migrations.

## Alternatives

- Keep Zod v3-style APIs (rejected: diverges from current dependency baseline and docs).
- Inline validation ad hoc per module (rejected: increases drift and duplicated logic).
- Rely on TypeScript types only (rejected: no runtime validation for untrusted input).

## Decision

Adopt Zod v4 conventions consistently:

- Use top-level validators (e.g., `z.email()`, `z.url()`) instead of `z.string().email()`.
- Use `z.strictObject` and `z.looseObject` to make unknown-key behavior explicit.
- Keep all schemas under `src/lib/schemas/` and export inferred types from there.
- Validate static datasets at module load time to prevent invalid data from shipping.

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | 9.3 | 3.26 |
| Application value | 0.30 | 9.1 | 2.73 |
| Maintenance & cognitive load | 0.25 | 9.0 | 2.25 |
| Architectural adaptability | 0.10 | 9.0 | 0.90 |

**Total:** 9.14 / 10.0

## Constraints

- API and security validation must reject unexpected keys where it matters (`z.strictObject`).
- Client form parsing may include extra fields and should tolerate them (`z.looseObject`).

## Design

### Schema placement

- Schemas live under `src/lib/schemas/`.
- Types are inferred from schemas and exported from `src/types/` or schema modules as appropriate.

### Unknown key behavior

- Client-facing form schemas: `z.looseObject` (tolerate HTML form extras).
- Server/security schemas: `z.strictObject` (reject unexpected keys).

## Consequences

### Positive Outcomes

- Schema examples in docs match v4 APIs.
- Security-sensitive inputs use `z.strictObject` to reject unexpected keys.
- Client-submitted forms can use `z.looseObject` to tolerate extra fields from HTML forms.

### Negative Consequences / Trade-offs

- Schema changes require updating both docs and tests to keep examples accurate.

### Ongoing Maintenance & Considerations

- Avoid mixing v3 and v4 styles in new code.
- Keep limits/constants (e.g., contact form bounds) shared so validation stays DRY.

### Dependencies

- **Added**: None (Zod already existed; upgraded to v4 baseline).
- **Removed**: None.

## Implementation notes

- Contact schemas: `contactFormSchema` uses `z.looseObject`, and
  `contactFormWithSecuritySchema` uses `z.strictObject`.
- Projects dataset is validated at the boundary with `githubProjectsFileSchema` at load time.

## Testing

- Unit tests validate schema behavior (happy paths and error paths).
- E2E tests validate contact form client-side behavior and payload shape (without relying on Next API routes).

## Changelog

- **1.0 (2026-01-16)**: Adopt Zod v4 conventions across the codebase.
