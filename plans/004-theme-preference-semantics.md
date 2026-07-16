# Plan 004: Expose the selected theme preference

> **Executor instructions**: Preserve `ThemeScript` as the only owner of the document theme class.
> Run every verification and update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat 151e9b6..HEAD -- src/components/theme \
>   src/components/ui/dropdown-menu.tsx src/__tests__/components/theme-toggle.test.tsx \
>   src/__tests__/components/theme-script.test.tsx e2e/navigation.spec.ts
> ```

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `151e9b6`, 2026-07-16

## Why this matters

The theme menu offers Light, Dark, and System as plain menu items with no selected state. A keyboard
or screen-reader user can change the preference but cannot discover which preference is active,
especially when System resolves to a light or dark appearance. Base UI already ships the correct
radio-menu primitives, so this can be fixed without a custom ARIA implementation or another theme
library.

## Current state

- `src/components/theme/theme-toggle.tsx:38-60` renders three `DropdownMenuItem` controls with
  `data-theme-set` and no checked state.
- `src/components/theme/theme-script.tsx` prevents theme flash, persists the preference, and alone
  toggles the root `dark` class through delegated clicks. Keep that ownership.
- `src/components/ui/dropdown-menu.tsx` wraps Base UI Menu Root, Group, Item, and Popup but not its
  existing `RadioGroup`, `RadioItem`, or `RadioItemIndicator` parts.
- The installed Base UI 1.6.0 declarations expose those parts under `Menu.RadioGroup`,
  `Menu.RadioItem`, and `Menu.RadioItemIndicator`.

## Target

- Theme options expose `role="menuitemradio"` and exactly one exposes `aria-checked="true"`.
- A small local preference state initializes safely from `localStorage.theme`, accepting only
  `light`, `dark`, or `system` and falling back to `system`.
- Base UI's controlled radio group updates that semantic state.
- The existing `data-theme-set` click contract remains, so `ThemeScript` still exclusively persists
  the preference and applies the root class.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Focused tests | `pnpm exec vitest run src/__tests__/components/theme-toggle.test.tsx src/__tests__/components/theme-script.test.tsx src/__tests__/components/ui-primitives-smoke.test.tsx` | exit 0 |
| Browser regression | `pnpm exec playwright test e2e/navigation.spec.ts` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:

- `src/components/theme/theme-toggle.tsx`
- `src/components/ui/dropdown-menu.tsx`
- Theme and primitive tests listed above
- `e2e/navigation.spec.ts`

**Out of scope**:

- Replacing `ThemeScript`
- Adding `next-themes` or another dependency
- Changing the theme palette, icon artwork, or storage key
- Cross-tab storage synchronization

## Steps

### Step 1: Wrap Base UI's radio-menu parts

Add typed `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, and
`DropdownMenuRadioItemIndicator` exports to `src/components/ui/dropdown-menu.tsx`. Match the existing
item styling and direct Base UI wrapper conventions. Do not manually assign ARIA roles that Base UI
already owns.

**Verify**: the UI primitive smoke test and typecheck pass.

### Step 2: Model only the stored preference in ThemeToggle

Add a `ThemePreference` union and a safe lazy initializer that reads `localStorage.theme` only when
`window` is available. Invalid, missing, or blocked storage returns `system`. This React state exists
only to control the radio group's selected semantics; it must never toggle `documentElement` classes
or write storage.

Render the three existing controls as radio items with values `light`, `dark`, and `system`. Preserve
their `data-theme-set` attributes so the existing delegated script remains the class and persistence
owner. Add a small checked indicator from the existing icon set if needed to make the visual state
discoverable without relying on color alone.

**Verify**: theme-toggle tests prove one item is checked for each stored value and invalid storage
falls back to System.

### Step 3: Prove keyboard and mobile behavior

Extend navigation E2E coverage to open the desktop and mobile theme menus, choose Dark or System by
keyboard, reopen the menu, and assert the chosen radio item remains checked. Restore System before
the test ends so later tests are isolated. Confirm Escape still closes the nested mobile menu and
the sheet still returns focus to Toggle menu.

**Verify**: `pnpm exec playwright test e2e/navigation.spec.ts` exits 0.

## Done criteria

- [ ] Theme options use Base UI radio-menu semantics.
- [ ] Exactly one preference is exposed as selected whenever the menu is open.
- [ ] `ThemeScript` remains the only root-class and persistence owner.
- [ ] No dependency is added and no theme flash is introduced.
- [ ] Focused tests, navigation E2E, and typecheck pass.

## STOP conditions

- Base UI radio items cannot preserve the existing native-button and delegated-click behavior.
- Implementing selection would require a second document-class owner.
- Server and client markup produce a hydration warning.

## Maintenance notes

The semantic preference is Light, Dark, or System. Do not mark the resolved OS appearance as selected
when the stored preference is System.
