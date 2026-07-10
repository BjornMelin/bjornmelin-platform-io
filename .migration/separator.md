# separator

2026-07-10 -- engine strategy using the shadcn Base registry; migrated.

## Changed

- `src/components/ui/separator.tsx:3` now uses Base Separator with horizontal and vertical sizing.
- Decorative consumers explicitly set `aria-hidden="true"`.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/separator.tsx` returns no matches.

## Left alone

- Border token, thickness, orientation API, and layout spacing remain unchanged.

## Behavior changes

- Decorative intent is explicit at call sites instead of a wrapper-wide Radix default.

## Verify by hand

- Inspect project and Agent Skills filter dividers and confirm decorative separators are absent from the accessibility tree.
