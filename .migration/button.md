# button

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/button.tsx:1` now uses `@base-ui/react/button` and keeps the existing variant contract.
- Link consumers use semantic Next.js links styled by `buttonVariants` instead of `asChild`.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/button.tsx` returns no matches.

## Left alone

- Button sizes, variants, focus rings, and disabled styling remain site-owned and visually unchanged.

## Behavior changes

- `asChild` is removed. Anchors remain anchors and receive button styling through `buttonVariants`.

## Verify by hand

- Tab through primary buttons and button-styled links; confirm focus rings, activation, and correct link semantics.
