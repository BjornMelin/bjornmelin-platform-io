# Frontend Architecture

The frontend is built with Next.js 16 using the App Router and static export
(`output: 'export'`).

## Project Structure

```text
src/
├── app/                    # Next.js 16 App Router pages
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── projects/          # Projects page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── contact/           # Contact form components
│   ├── layout/            # Layout components (navbar, footer)
│   ├── projects/          # Project-related components
│   ├── sections/          # Page sections
│   ├── shared/            # Shared components
│   ├── theme/             # Theme components
│   └── ui/                # UI component library (shadcn/ui)
├── data/                  # Static data files
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and services
└── types/                 # TypeScript type definitions
```

## Key Technologies

| Technology | Purpose |
| ------------ | --------- |
| React 19.2.3 | UI library (RSC + Client Components) |
| Next.js 16.1.3 | React framework with App Router |
| TypeScript 5.9.3 | Type-safe JavaScript |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui | UI component library |
| Zod | Runtime validation |

## Image Optimization

Static export cannot use the default Next.js Image Optimization runtime. We
instead generate image variants at build time and use a custom `next/image`
loader (supported for static exports).

See ADR-0006 for the detailed decision and constraints.

### Build Process

The build uses a prebuild hook to ensure variants exist before the export is
generated:

```bash
bun run build  # Runs: prebuild (sharp) → bun --bun next build → CSP hash generation
```

### Output

- Source images in `public/` are converted to WebP variants.
- Variants are written to `public/_images/` and copied into `out/_images/` during export.
- `next/image` requests resolve to `/_images/<src>_<width>.webp` via `image-loader.ts`.

### Key Files

- `scripts/generate-static-image-variants.mjs`: Sharp-based variant generation (repo root)
- `image-loader.ts`: next/image custom loader for static export
- `next.config.mjs`: `images.loader = "custom"` and size configuration

## Components

### Layout Components

- `AppShell`: Skip link + single main landmark wrapper
- `Navbar`: Site navigation with mobile menu
- `Footer`: Site footer with links
- `ThemeProvider`: Dark/light theme management

### Page Sections

- `Hero`: Homepage hero section with animations
- `AboutDetail`: About page content
- `FeaturedProjects`: Project showcase grid
- `ContactForm`: Contact form with Zod validation

### Shared Components

- `SectionHeader`: Consistent section headers
- `ProjectCard`: Project display card
- `Badge`: Technology tag display

## Data Management

- Static data stored in `/data` directory
- TypeScript interfaces in `/types`
- Environment variables managed through `src/env.mjs`

## Styling

- Tailwind CSS for utility-first styling
- Custom components using shadcn/ui
- Dark/light theme support via next-themes
- Geist font family

## Performance

| Optimization | Implementation |
| -------------- | ---------------- |
| Static Export | `output: 'export'` in next.config.mjs |
| Image Optimization | WebP conversion, responsive sizes |
| Bundle Analysis | `bun run analyze` |
| Modern Targets | Browserslist for ES6 modules |

## SEO

- Metadata configuration in `src/lib/metadata.ts`
- Dynamic sitemap generation
- Robots.txt configuration

## Error Handling

- Error boundaries for component-level errors
- Toast notifications via shadcn/ui Toaster
- Form validation errors via Zod

## Development Practices

- Functional components
- React Server Components run at build time for static export
- Strict TypeScript
- Biome for linting and formatting

## Static Export Constraints

Static export disallows runtime request APIs (cookies/headers), redirects/rewrites,
Server Actions, ISR, and request-dependent Route Handlers. See ADR-0005.
