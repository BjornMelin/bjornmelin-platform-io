# Frontend Architecture

The frontend is built with Next.js 14+ using the App Router and React Server
Components.

## Project Structure

```text
src/
├── app/                    # Next.js 14+ App Router pages
│   ├── about/             # About page
│   ├── api/               # API routes
│   ├── contact/           # Contact page
│   ├── projects/         # Projects page
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── contact/          # Contact form components
│   ├── layout/           # Layout components (navbar, footer)
│   ├── projects/         # Project-related components
│   ├── sections/         # Page sections
│   ├── shared/           # Shared components
│   ├── theme/            # Theme components
│   └── ui/               # UI component library
├── data/                 # Static data files
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
└── types/                # TypeScript type definitions
```

## Key Technologies

- **Next.js 14+**: React framework with App Router and Server Components
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **React Server Components**: For improved performance and SEO

## Components

### Layout Components

- `Navbar`: Site navigation
- `Footer`: Site footer
- `ThemeProvider`: Dark/light theme management

### Page Sections

- `Hero`: Homepage hero section
- `About`: About section with personal details
- `FeaturedProjects`: Project showcase
- `ContactForm`: Contact form with validation

### Shared Components

- `SectionHeader`: Consistent section headers
- `TechBadge`: Technology tag display
- `ErrorBoundary`: Error handling wrapper

## Data Management

- Static data stored in `/data` directory
- TypeScript interfaces in `/types`
- Environment variables managed through `env.mjs`

## Styling

- Tailwind CSS for utility-first styling
- Custom components using shadcn/ui
- Dark/light theme support
- Custom fonts (Geist)

## Performance Optimization

- React Server Components for improved initial load
- Image optimization with Next.js Image component
- Font optimization with Next.js Font system
- Static site generation where possible

## SEO

- Metadata configuration in `src/lib/metadata.ts`
- Structured data for better search results
- Dynamic sitemap generation
- Robots.txt configuration

## Error Handling

- Custom error boundaries for component-level errors
- Global error handling utilities
- Toast notifications for user feedback

## Development Practices

- Component-first architecture
- Type-safe development with TypeScript
- Consistent lint/format with Biome
- Modular and reusable component design
