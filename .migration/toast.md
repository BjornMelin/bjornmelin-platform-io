# toast

2026-07-10 -- engine strategy using Base UI source and official Toast documentation; migrated.

## Changed

- `src/components/ui/toast.tsx:3` defines Base manager-owned toast presentation.
- `src/components/ui/toaster.tsx:15` renders records from `useToastManager`.
- `src/app/providers.tsx:14` owns the single provider;
  `src/components/contact/contact-form.tsx:38` adds native manager records.
- The fixed empty viewport ignores pointer input while each toast root opts back
  into pointer interaction, so notifications never cover header controls.
- `src/hooks/use-toast.ts` and four tests for the parallel custom store were deleted.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/toast.tsx
  src/components/ui/toaster.tsx src/app/providers.tsx
  src/components/contact/contact-form.tsx` returns no matches.

## Left alone

- Contact success/error alerts, visible toast copy, one-toast limit, position, and destructive styling remain unchanged.

## Behavior changes

- The bespoke global `toast()`/update/dismiss API is removed; producers use the Base toast manager.

## Verify by hand

- Submit the contact form successfully and with a server error; confirm one
  toast appears, announces its content, swipes, and closes from its button.
