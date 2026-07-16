# Plan 001: Centralize and correct public identity URLs

> **Executor instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving on. If a STOP condition occurs, stop and report instead
> of improvising. When done, update this plan's status row in `plans/README.md`.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat 151e9b6..HEAD -- src/lib/profile.ts src/lib/schemas/profile.ts \
>   src/components/structured-data.tsx src/components/contact/contact-form.tsx \
>   src/components/layout/footer.tsx src/__tests__
> ```

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `151e9b6`, 2026-07-16

## Why this matters

The public JSON-LD currently associates Bjorn with another LinkedIn slug and an obsolete ORCID, and
the contact form's error fallback repeats the wrong LinkedIn URL. The visible footer already uses
the current LinkedIn and ORCID values. One typed profile owner should feed every visible and
machine-readable identity surface so search engines and users cannot receive conflicting identities.

## Current state

- `src/lib/profile.ts` is the canonical typed profile content but does not own social URLs.
- `src/lib/schemas/profile.ts` defines that content's strict Zod contract.
- `src/components/structured-data.tsx:21-26` hardcodes `sameAs`, including
  `https://linkedin.com/in/bjornmelin` and `https://orcid.org/0000-0003-3891-5522`.
- `src/components/contact/contact-form.tsx:209` hardcodes
  `https://www.linkedin.com/in/bjornmelin/`.
- `src/components/layout/footer.tsx:85` already uses `https://linkedin.com/in/bjorn-melin` and line
  103 already uses `https://orcid.org/0009-0004-1978-3356`.
- `src/lib/schemas/https-url.ts` is the repository's existing HTTPS URL validator. Reuse it.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Focused tests | `pnpm exec vitest run src/__tests__/components/structured-data.test.tsx src/__tests__/components/contact-form.test.tsx src/__tests__/components/navbar-footer.test.tsx` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:

- `src/lib/profile.ts`
- `src/lib/schemas/profile.ts`
- `src/components/structured-data.tsx`
- `src/components/contact/contact-form.tsx`
- `src/components/layout/footer.tsx`
- Existing focused tests under `src/__tests__/`

**Out of scope**:

- Profile biography or visual design changes
- New social providers
- Any generated project metadata

## Git workflow

- Branch: `fix/platform-focused-polish`
- Use conventional commits, matching `feat(ui): migrate shadcn primitives to Base UI`.
- Do not push or open a PR until the operator requests the full branch ship.

## Steps

### Step 1: Extend the canonical profile contract

Add a strict `socialUrls` object to `ProfileSchema` using `httpsUrlSchema` for `github`, `linkedin`,
`medium`, `orcid`, and `coursera`. Add these exact values to `PROFILE`:

- GitHub: `https://github.com/bjornmelin`
- LinkedIn: `https://www.linkedin.com/in/bjorn-melin`
- Medium: `https://medium.com/@bjornmelin`
- ORCID: `https://orcid.org/0009-0004-1978-3356`
- Coursera: `https://www.coursera.org/learner/bjorn-melin`

**Verify**: `pnpm type-check` exits 0.

### Step 2: Migrate every identity consumer

Use `PROFILE.socialUrls` in `generatePersonSchema`, the contact error fallback, and every external
social link in the footer. Preserve labels, target behavior, classes, and link order. After migration,
no component may hardcode any of these five URLs.

**Verify**:
`rg -n "linkedin\.com/in/bjornmelin|0000-0003-3891-5522" src` returns no matches.

### Step 3: Lock the canonical contract with tests

Update structured-data, contact-form, and footer tests to assert the canonical values from `PROFILE`
are exposed. Add a profile-schema assertion if needed to prove non-HTTPS identity URLs are rejected.
Do not duplicate the literal URLs across multiple tests when `PROFILE.socialUrls` is the intended
source of truth.

**Verify**: run the focused test command in the table; all tests pass.

## Done criteria

- [ ] Every public identity URL is owned by `PROFILE.socialUrls`.
- [ ] JSON-LD, contact fallback, and footer resolve to the same LinkedIn and ORCID identities.
- [ ] The two obsolete identity values have zero matches under `src/`.
- [ ] Focused tests, typecheck, and lint exit 0.

## STOP conditions

- The footer's current LinkedIn or ORCID values changed after commit `151e9b6`.
- The correction would require changing the person's identity rather than consolidating consumers.
- A public URL cannot satisfy the existing HTTPS-only schema.

## Maintenance notes

Future public profile links belong in `PROFILE.socialUrls`, not component literals. Review the JSON-LD
output whenever that canonical object changes.
