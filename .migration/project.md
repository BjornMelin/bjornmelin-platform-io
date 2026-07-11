# project

2026-07-10 -- whole-project engine strategy with shadcn registry, official docs, and OpenSrc verification; migrated.

## Changed

- `package.json:50` replaces `radix-ui` with `@base-ui/react@1.6.0` and
  removes the now-unused `tailwindcss-animate` and `next-themes` dependencies.
- `components.json:3` switches shadcn from legacy `new-york`/Radix to `base-nova`/Base.
- `next.config.mjs` drops the Radix optimizer; `tailwind.config.ts` is deleted.
- Live wrappers and consumers use Base direct subpaths, `render`, typed Select items, and native toast management.
- Dead Dialog, NavigationMenu, Toggle, ToggleGroup, and custom toast-store code is deleted.
- `rg -n 'radix-ui|@radix-ui|--radix-|asChild' src package.json components.json next.config.mjs` returns no matches.

## Left alone

- Site-specific class recipes, route data, URL contracts, static-export
  architecture, CSP generation, and infrastructure are unchanged.
- `SPEC-0010` and deprecated `SPEC-0011` retain clearly marked historical Radix references.

## Behavior changes

- Composition uses Base `render` and semantic links instead of Radix `asChild`.
- Base state attributes and positioning replace Radix state attributes and CSS variables.
- The local toast store and four unused primitive APIs no longer exist.
- `ThemeScript` is the single theme owner; the redundant client theme provider is removed.

## Verify by hand

- Exercise desktop and mobile navigation, theme selection, all project and
  Agent Skills filters, tag popovers, expandable text, and contact toasts.
- Serve the production `out/` directory and repeat the overlay checks with `agent-browser`.
