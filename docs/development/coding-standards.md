# Coding Standards

## Code Quality Tools

### Biome (Linting & Formatting)

The project uses Biome for consistent code formatting and linting.

```bash
# Run linting
pnpm lint

# Run formatting
pnpm format

# Check formatting without applying changes
pnpm format:check
```

Configuration is in `biome.json` with rules for:
- TypeScript best practices
- React best practices
- Import organization
- Code formatting

## TypeScript

### Type Safety

```typescript
// Use explicit types
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

// Use type inference when possible
const [isLoading, setIsLoading] = useState(false);

// Use proper return types
async function sendEmail(data: ContactForm): Promise<{ success: boolean }> {
  // Implementation
}
```

### Type Organization

```typescript
// Place types in dedicated files
// src/types/project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  github?: string;
  tags: string[];
}

// Use type imports
import type { Project } from "@/types/project";
```

## Next.js Components

### Server Components (Default)

```typescript
// app/projects/page.tsx
import { ProjectGrid } from "@/components/projects/project-grid";

export default async function ProjectsPage() {
  return (
    <main className="container py-8">
      <ProjectGrid />
    </main>
  );
}
```

### Client Components

```typescript
// Add 'use client' directive at the top
"use client";

// components/contact/contact-form.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Implementation
}
```

## File Structure

```
feature/
├── components/     # Feature-specific components
│   ├── server/    # Server components
│   └── client/    # Client components
├── lib/           # Feature-specific utilities
└── types/         # Feature-specific types
```

## Tailwind CSS

### Class Organization

```typescript
// Organized by purpose
<div
  className={cn(
    // Layout
    "flex flex-col gap-4",
    // Spacing
    "p-4 my-2",
    // Colors
    "bg-background text-foreground",
    // States
    "hover:bg-accent focus:ring-2",
    // Responsive
    "md:flex-row lg:p-6"
  )}
>
```

### Component Patterns

```typescript
// Use cn utility for conditional classes
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "default" | "outline";
  className?: string;
}

export function Button({ variant = "default", className }: ButtonProps) {
  return (
    <button
      className={cn(
        "base-styles",
        variant === "outline" && "outline-styles",
        className
      )}
    />
  );
}
```

## API Routes

### Route Handlers

```typescript
// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/schemas/contact";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);
    // Implementation
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
```

## Validation with Zod

### Schema Definition

```typescript
// lib/schemas/contact.ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

## Error Handling

### API Errors

```typescript
// lib/utils/error-handler.ts
import { z } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return { error: "Validation error", details: error.errors, status: 400 };
  }
  // Other error types
}
```

### Client-side Errors

```typescript
"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";

export function ClientComponent() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      {/* Component content */}
    </ErrorBoundary>
  );
}
```

## Documentation

### Component Documentation

```typescript
/**
 * ProjectCard component displays a project with its details
 *
 * @param {Project} project - Project data to display
 * @param {string} className - Optional additional classes
 * @returns {JSX.Element} Project card component
 */
export function ProjectCard({ project, className }: ProjectCardProps) {
  // Implementation
}
```

### Type Documentation

```typescript
/**
 * Represents project data structure
 */
export interface Project {
  /** Unique identifier */
  id: string;
  /** Project title */
  title: string;
  /** Project description */
  description: string;
  // ... other fields
}
```

## Best Practices

### Performance

- Use Server Components by default
- Implement proper loading states
- Optimize images using next/image
- Minimize client-side JavaScript

### Security

- Validate all inputs with Zod schemas
- Sanitize outputs
- Use proper CORS settings
- Implement rate limiting

### Accessibility

- Use semantic HTML
- Include ARIA labels
- Ensure keyboard navigation
- Maintain proper contrast

### State Management

- Use Server Components when possible
- Keep state close to where it's used
- Implement proper loading states
- Handle errors gracefully

## Git Commit Standards

```bash
# Format: <type>(<scope>): <description>
feat(contact): add email validation
fix(projects): resolve image loading issue
docs(readme): update setup instructions
style(ui): improve button styling
```

For more specific examples and patterns, refer to the codebase and component documentation.
