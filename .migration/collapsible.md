# collapsible

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/collapsible.tsx:3` maps Root, Trigger, and Panel to Base UI.
- `src/components/shared/expandable-text.tsx:68` uses `keepMounted` and Base `render` composition.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/collapsible.tsx src/components/shared/expandable-text.tsx` returns no matches.

## Left alone

- The three-line truncation measurement and Show More copy remain unchanged.

## Behavior changes

- Radix `forceMount` and `asChild` are replaced by Base `keepMounted` and `render`.

## Verify by hand

- Open and close a truncated project description; confirm the text stays measurable and focus remains on the trigger.
