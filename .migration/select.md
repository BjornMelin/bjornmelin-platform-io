# select

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/select.tsx:3` maps Base Select Trigger, Portal, Positioner, Popup, List, Group, Item, and indicators.
- Project and Agent Skills consumers provide typed `items` collections at
  `src/components/projects/project-grid.tsx:131` and
  `src/components/agent-skills/agent-skills-grid.tsx:171`.
- Popup height uses Base's `--available-height`; the list is no longer clipped
  to the trigger height, with a browser-level regression assertion in
  `e2e/projects.spec.ts`.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/select.tsx
  src/components/projects/project-grid.tsx
  src/components/agent-skills/agent-skills-grid.tsx` returns no matches.

## Left alone

- Filter values, URL parameter names, sorting rules, labels, and trigger sizing remain unchanged.

## Behavior changes

- Base `onValueChange` can provide `null`; consumers ignore null clears that are not valid filter states.
- Base guards accidental opening mouseup selection for 400 ms; explicit
  pointer-down clicks and keyboard selections remain immediate.

## Verify by hand

- Open every project and Agent Skills select, use arrows and typeahead, select
  an option, press Escape, and confirm the popup is not constrained to the
  trigger height. It must display as many options as the viewport allows and
  scroll when the viewport cannot show them all. Confirm the trigger label and
  URL state update.
