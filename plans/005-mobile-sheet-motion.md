# Plan 005: Make the mobile sheet respond promptly

> **Executor instructions**: Change motion properties only. Preserve the sheet markup, Base UI
> behavior, and reduced-motion escape hatch. Run every verification and update `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 151e9b6..HEAD -- src/components/ui/sheet.tsx src/__tests__/components/ui-primitives-smoke.test.tsx e2e/navigation.spec.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `151e9b6`, 2026-07-16

## Why this matters

The frequent mobile navigation drawer uses a 500 ms ease-in-out transform. A production interaction
capture taken immediately after activation still showed almost the entire panel off-canvas, while
the stable panel itself was polished and accessible. A 300 ms entrance with a faster 200 ms exit
keeps the physical drawer motion legible without making navigation feel delayed.

## Current state

```tsx
// src/components/ui/sheet.tsx:28 - current backdrop
"... transition-opacity duration-300 motion-reduce:transition-none ..."

// src/components/ui/sheet.tsx:37 - current panel
"... transition-transform duration-500 ease-in-out motion-reduce:transition-none data-ending-style:duration-300"
```

`src/components/ui/popover.tsx` and the menu wrappers already use property-scoped transitions and
`motion-reduce:transition-none`; preserve that pattern. The repository's completed Base UI migration
also uses starting and ending data styles instead of Radix state selectors.

## Target

```tsx
// backdrop
"... transition-opacity duration-200 ease-out motion-reduce:transition-none data-ending-style:ease-in ..."

// panel
"... transition-transform duration-300 ease-out motion-reduce:transition-none data-ending-style:duration-200 data-ending-style:ease-in"
```

Do not use `transition-all`, springs, or a new animation library.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Primitive tests | `pnpm exec vitest run src/__tests__/components/ui-primitives-smoke.test.tsx src/__tests__/components/navbar-footer.test.tsx` | exit 0 |
| Navigation E2E | `pnpm exec playwright test e2e/navigation.spec.ts` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:

- `src/components/ui/sheet.tsx`
- Existing sheet/navigation tests only if needed to lock the class contract

**Out of scope**:

- Sheet dimensions, content, stacking, focus behavior, or markup
- Other animation primitives
- New easing tokens or dependencies

## Steps

### Step 1: Tighten the backdrop timing

Change the backdrop to 200 ms ease-out on entry and an ending-style ease-in exit. Keep opacity as the
only transitioned property and keep `motion-reduce:transition-none`.

**Verify**: primitive smoke tests pass.

### Step 2: Give the panel an asymmetric physical curve

Change the panel to 300 ms ease-out on entry and 200 ms ease-in on exit. Preserve every placement,
starting-style, ending-style, and responsive class.

**Verify**: typecheck and navigation E2E pass.

### Step 3: Perform the required feel check

At 390 by 844, open the mobile navigation and capture its stable state. Confirm it reaches the same
final position, traps focus, prevents body scrolling, and restores focus to Toggle menu after Escape.
In browser reduced-motion emulation, confirm the sheet opens and closes without spatial transition.
At normal motion, inspect computed styles and confirm the panel reports 0.3 s while open and the
backdrop reports 0.2 s.

**Verify**: save before and after mobile-open screenshots outside the repository and report their
paths with the browser-test result.

## Done criteria

- [ ] Panel entry is 300 ms ease-out and exit is 200 ms ease-in.
- [ ] Backdrop transition is 200 ms and property-scoped.
- [ ] Reduced motion removes the transitions.
- [ ] Focus trap, body scroll lock, Escape dismissal, and focus return still work.
- [ ] Primitive tests, navigation E2E, and typecheck pass.

## STOP conditions

- Tailwind 4.3.2 does not generate the ending-style easing variant.
- Any focus, scroll-lock, or final-position behavior changes.
- The change requires editing Base UI internals or adding a dependency.

## Maintenance notes

Keep frequent navigation overlays below 350 ms unless product research demonstrates a need for a
slower cinematic transition. Exits should remain faster than entrances.
