# label

2026-07-10 -- engine strategy using the shadcn Base registry; migrated to native HTML.

## Changed

- `src/components/ui/label.tsx:15` renders a styled native `label` because Base UI does not require a label primitive.
- `rg -n 'radix-ui|@radix-ui' src/components/ui/label.tsx` returns no matches.

## Left alone

- Existing typography, disabled-peer styling, and form `htmlFor` relationships remain unchanged.

## Behavior changes

## Verify by hand

- Click each contact-form label and confirm its input receives focus; verify error and disabled styling.
