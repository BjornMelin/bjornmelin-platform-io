# dialog

2026-07-10 -- engine strategy with dead-code proof; deleted.

## Changed

- `src/components/ui/dialog.tsx` was deleted because no production consumer imported it.
- Dialog-only smoke coverage was removed with the dead wrapper.
- `rg -n 'radix-ui|@radix-ui' src/components/ui src/__tests__` returns no source matches.

## Left alone

- The live mobile sheet remains and is migrated separately through Base Dialog.

## Behavior changes

- The unused local Dialog API no longer exists; callers must add the current shadcn Base dialog if a real use case appears.

## Verify by hand

- Confirm all current modal behavior is owned by the mobile sheet and no route references a generic dialog.
