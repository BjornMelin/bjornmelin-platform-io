# Frontend Architecture

The frontend is built with Next.js 14 using the App Router and static export
(`output: 'export'`).

## Project Structure

```text
src/
├── app/                    # Next.js 14 App Router pages
│   ├── about/             # About page
│   ├── api/               # API routes (dev only)
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
| Next.js 14.2.35 | React framework with App Router |
| TypeScript 5.9.3 | Type-safe JavaScript |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui | UI component library |
| Framer Motion | Animation library (LazyMotion) |
| Zod | Runtime validation |

## Animation Optimization (LazyMotion)

The project uses Framer Motion with LazyMotion for optimized bundle size.

### Configuration

```typescript
// src/lib/framer-features.ts
export const domAnimation = () =>
  import("framer-motion").then((mod) => mod.domAnimation);
```

```typescript
// src/app/providers.tsx
import { LazyMotion } from "framer-motion";

const loadFeatures = () =>
  import("@/lib/framer-features").then((mod) => mod.domAnimation());

export function Providers({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
```

### Usage

Components use `m` instead of `motion` for tree-shaking:

```typescript
import { m } from "framer-motion";

// Use m.div instead of motion.div
<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  Content
</m.div>
```

### Bundle Impact

- Before: ~32KB gzipped (full framer-motion)
- After: ~5KB gzipped (domAnimation feature set)
- Savings: 27KB (84% reduction)

## Image Optimization

Images are optimized at build time using next-export-optimize-images.

### Configuration

```javascript
// export-images.config.js
const config = {
  convertFormat: [
    ["png", "webp"],
    ["jpg", "webp"],
    ["jpeg", "webp"],
  ],
  quality: 75,
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  generateFormats: ["webp"],
};
```

### Build Process

The build command runs both Next.js build and image optimization:

```bash
pnpm build  # Runs: next build && next-export-optimize-images
```

### Output

- Source images in `public/` are converted to WebP
- Responsive variants are generated for each device size
- Optimized images are placed in `out/_next/static/chunks/images/`

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
| Animation Bundle | LazyMotion (27KB savings) |
| Bundle Analysis | `pnpm analyze` |
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
