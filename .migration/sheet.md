# sheet

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/sheet.tsx:3` maps the sheet to Base Dialog Backdrop, Popup, Trigger, Close, Title, and Description.
- `src/components/layout/mobile-nav.tsx:80` composes the menu button through the Base trigger.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/sheet.tsx src/components/layout/mobile-nav.tsx` returns no matches.

## Left alone

- Four side variants, mobile width, navigation content, and route-close behavior remain unchanged.

## Behavior changes

- Motion uses Base starting and ending style attributes instead of Radix state attributes.

## Verify by hand

- At mobile width, open the menu, tab within it, press Escape, reopen and close
  it, and confirm focus always returns to Toggle menu.
