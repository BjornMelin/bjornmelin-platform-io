# toggle-group

2026-07-10 -- engine strategy with dead-code proof; deleted.

## Changed

- `src/components/ui/toggle-group.tsx` was deleted because it had no production consumer.
- The unused `ToggleGroupMocks` test helper was deleted.
- `rg -n 'radix-ui|@radix-ui' src/components/ui src/test src/__tests__` returns no source matches.

## Left alone

- Select controls continue to own all multi-option filtering interactions.

## Behavior changes

- The unused local ToggleGroup API no longer exists.

## Verify by hand

- Confirm all filter choices use accessible select controls and no route expects toggle-group behavior.
