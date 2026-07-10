# popover

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/popover.tsx:3` composes Base Portal, Positioner, and Popup.
- `src/components/projects/project-tags-overflow.tsx:42` uses Base `render` trigger composition.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/popover.tsx
  src/components/projects/project-tags-overflow.tsx` returns no matches.

## Left alone

- Tag count, alignment, width, typography, and badge content remain unchanged.

## Behavior changes

- Positioning props are owned by Base Positioner rather than the popup node.

## Verify by hand

- Open a project tag overflow popover near viewport edges, press Escape, and confirm focus returns to the count trigger.
