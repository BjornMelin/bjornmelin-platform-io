# toggle

2026-07-10 -- engine strategy with dead-code proof; deleted.

## Changed

- `src/components/ui/toggle.tsx` was deleted because it had no production consumer.
- Toggle-only smoke coverage was removed with the dead wrapper.
- `rg -n 'radix-ui|@radix-ui' src/components/ui src/__tests__` returns no source matches.

## Left alone

- Ordinary site buttons and the theme menu retain their existing pressed and selected behaviors.

## Behavior changes

- The unused local Toggle API and its Radix `data-state` styling no longer exist.

## Verify by hand

- Confirm no interface exposes a standalone pressed toggle and all existing buttons retain correct roles.
