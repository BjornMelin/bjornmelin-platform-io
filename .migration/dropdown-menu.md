# dropdown-menu

2026-07-10 -- engine strategy using the shadcn Base registry and Base UI source; migrated.

## Changed

- `src/components/ui/dropdown-menu.tsx:3` now composes Base Menu Portal, Positioner, Popup, Group, and Item.
- `src/components/theme/theme-toggle.tsx:28` uses Base `render` composition and direct menu-item handlers.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/dropdown-menu.tsx src/components/theme/theme-toggle.tsx` returns no matches.

## Left alone

- Theme labels, icons, menu width, and light/dark/system values remain unchanged.

## Behavior changes

- Menu items are the interactive elements instead of wrapping nested buttons.

## Verify by hand

- Open the theme menu by mouse and keyboard, move through all items, choose
  each theme, and confirm focus returns to the trigger.
