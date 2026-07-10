# navigation-menu

2026-07-10 -- engine strategy with dead-code proof; deleted.

## Changed

- `src/components/ui/navigation-menu.tsx` was deleted because it had no production consumer.
- Its test-only trigger-style coverage was deleted with the wrapper.
- `rg -n 'radix-ui|@radix-ui' src/components/ui src/__tests__` returns no source matches.

## Left alone

- Desktop navigation remains semantic links; mobile navigation remains a Base-backed sheet.

## Behavior changes

- The unused local NavigationMenu API and trigger-style helper no longer exist.

## Verify by hand

- Traverse desktop navigation by keyboard and confirm all routes and focus indicators still work.
