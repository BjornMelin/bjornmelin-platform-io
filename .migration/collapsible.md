# collapsible

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/collapsible.tsx:3` maps Root, Trigger, and Panel to Base UI.
- `src/components/shared/expandable-text.tsx:65` keeps the clamped preview
  visible beside a Base-composed trigger instead of placing visible preview
  text inside a closed panel.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/collapsible.tsx src/components/shared/expandable-text.tsx` returns no matches.

## Left alone

- The three-line truncation measurement and Show More copy remain unchanged.

## Behavior changes

- Radix `asChild` is replaced by Base `render`; Base Root and Trigger own the
  disclosure state while the measurable preview remains visible when closed.

## Verify by hand

- Confirm project descriptions are visible while closed, then open and close a
  truncated description and confirm the text stays measurable and focus remains
  on the trigger.
