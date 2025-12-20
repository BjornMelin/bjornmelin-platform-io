# Development Overview

## Introduction

Development documentation for the bjornmelin-platform-io project.

## Documentation Structure

- [Getting Started](./getting-started.md) - Setup and initial development guide
- [Coding Standards](./coding-standards.md) - Code style and practices
- [Testing Strategies](./testing.md) - Testing methodologies and tools
- [Releasing](./releasing.md) - Codex-assisted release automation

## Development Environment

### Prerequisites

- Node.js 24.x LTS (pinned via `.nvmrc` and enforced by the `engines` field)
- pnpm package manager (enable via `corepack enable pnpm`)
- AWS CLI configured with appropriate credentials
- Git

### Core Technologies

#### Frontend

- Next.js 14.2.35 (App Router, static export)
- React 18.3.1
- TypeScript 5.8
- Tailwind CSS
- shadcn/ui components
- Framer Motion (LazyMotion)

#### Build Optimization

- next-export-optimize-images (WebP conversion)
- @next/bundle-analyzer
- Browserslist (ES6 module targets)

#### Infrastructure

- AWS CDK
- AWS S3
- Resend (email delivery)

#### Development Tools

- Biome (linting and formatting)
- Zod for validation
- Vitest (unit tests)
- Playwright (E2E tests)

## Development Workflow

### 1. Local Development

```mermaid
graph LR
    A[Local Branch] --> B[Development]
    B --> C[Code Review]
    C --> D[Testing]
    D --> E[Deploy]
```

### 2. Code Quality

- TypeScript for type safety
- Biome for linting and formatting
- Git hooks for pre-commit checks

### 3. Testing Requirements

- Component testing with Vitest
- E2E testing with Playwright
- Type checking with `pnpm type-check`

## Code Organization

```text
src/
├── app/          # Next.js 14 App Router pages
├── components/   # React components
├── lib/          # Utilities and services
├── types/        # TypeScript types
└── data/         # Static data
```

## Performance

- Server Components where applicable
- Static generation (`output: 'export'`)
- Image optimization (WebP via next-export-optimize-images)
- Animation optimization (LazyMotion reduces bundle by 27KB)
- Bundle size monitoring (`pnpm analyze`)

## Type Safety

- Strict TypeScript configuration
- Zod for runtime validation
- Type-safe environment variables (`src/env.mjs`)

## Component Development

- Functional components with React Server Components
- Custom hooks in `/hooks`
- Shared utilities in `/lib`
- Error boundaries for graceful degradation

## State Management

- React Server Components for server state
- Local component state with `useState`
- Form state with react-hook-form

## Security

- Input validation with Zod
- Environment variable validation (`@t3-oss/env-nextjs`)
- Secure data handling

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production (includes image optimization)
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Analyze bundle size
pnpm analyze
```

## Release Process

Releases are created automatically by Codex-assisted workflows:

- Auto Release PR: analyzes the full diff, enforces a SemVer floor, proposes version bump.
- Finalize Release: tags the merged release commit and publishes a GitHub Release.

See the full guide at [Releasing](./releasing.md).

## Infrastructure Development

- AWS CDK for infrastructure provisioning
- Infrastructure code in `/infrastructure`
- CDK tests with Vitest

## Continuous Integration

- Code quality checks (Biome)
- Type checking
- Unit and E2E test execution
- Build verification
- Lighthouse performance checks

For detailed information, refer to the specific guides in each section.
