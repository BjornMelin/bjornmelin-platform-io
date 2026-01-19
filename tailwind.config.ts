import type { Config } from "tailwindcss";

/**
 * Tailwind v4 uses a CSS-first configuration in `src/app/globals.css`.
 *
 * This file exists only for tooling (e.g. shadcn/ui) that expects a Tailwind config
 * path. Tailwind v4 does not auto-load config files unless you opt in via `@config`.
 */
export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
