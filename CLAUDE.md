# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **bjornmelin-platform-io**, a cloud-native portfolio platform built with Next.js 15, React 19, and AWS CDK. It demonstrates modern web development practices with comprehensive security, testing, and DevOps integration.

## Development Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build production application
pnpm start        # Start production server
pnpm serve        # Serve production build locally

# Code Quality (run before committing)
pnpm lint         # Run Biome linter with --write
pnpm format       # Run Biome formatter with --write  
pnpm type-check   # TypeScript type checking

# Testing
pnpm test         # Run unit tests with Vitest
pnpm test:ui      # Run tests with Vitest UI
pnpm test:coverage # Run tests with coverage (90% thresholds)
pnpm test:e2e     # Run E2E tests with Playwright
pnpm test:e2e:docker # Run E2E tests in Docker (recommended)

# Infrastructure (from /infrastructure directory)
pnpm cdk deploy   # Deploy AWS infrastructure
```

## Architecture Overview

**Frontend**: Next.js 15 App Router with React 19, TypeScript, Tailwind CSS, shadcn/ui
**Backend**: Next.js API routes with Resend email integration  
**Infrastructure**: AWS CDK with CloudFront, S3, Route 53, ACM
**Testing**: Vitest (unit) + Playwright (E2E) with 90% coverage thresholds
**Security**: CSRF protection, rate limiting, input sanitization, XSS prevention

## Key Directory Structure

```
src/
├── app/              # Next.js 15 App Router
│   ├── api/         # API routes (contact, CSRF)
│   └── */           # Page routes
├── components/      # React components
│   ├── contact/     # Contact form with security
│   ├── layout/      # Navigation, footer
│   ├── sections/    # Page sections
│   └── ui/          # shadcn/ui components
├── lib/             # Core utilities
│   ├── security/    # CSRF, rate limiting
│   ├── services/    # External integrations
│   ├── validation/  # Zod schemas
│   └── feature-flags/ # Feature flag system
└── data/            # Static data (projects, experience)
```

## Development Standards

**Package Management**: Use pnpm for all Node.js/TypeScript operations
**Code Quality**: Use Biome (not ESLint) for formatting and linting with 2-space indentation, 100-char line width
**Type Safety**: Use strict Zod schema validation throughout
**Testing**: Use Vitest for unit tests, maintain 90% coverage thresholds
**Git**: Use conventional commits format, never mention "Claude Code" in commits/PRs

## Security Implementation

The project implements enterprise-grade security:
- **CSRF Protection**: Modern token-based implementation in `src/lib/security/csrf-modern.ts`  
- **Rate Limiting**: 5 requests per 5 minutes in `src/lib/security/rate-limiter.ts`
- **Input Sanitization**: DOMPurify integration in contact forms
- **Form Validation**: Strict Zod schemas in `src/lib/validation/`

## Testing Strategy

**Unit Tests**: Vitest with jsdom environment, React Testing Library
- Test setup: `src/test/setup.ts`
- Coverage thresholds: 90% for lines, functions, branches, statements
- Run with: `pnpm test` or `pnpm test:coverage`

**E2E Tests**: Playwright with Chrome-focused testing
- Location: `e2e/` directory with comprehensive contact form security tests
- Docker containerized for CI/CD consistency  
- Run with: `pnpm test:e2e:docker` (recommended) or `pnpm test:e2e`

## Configuration Files

- **Biome**: `biome.json` (formatting: 2 spaces, 100 chars, double quotes, trailing commas)
- **TypeScript**: `tsconfig.json` (strict mode enabled)
- **Vitest**: `vitest.config.ts` (jsdom environment, 90% coverage thresholds)
- **Playwright**: `playwright.config.ts` (Chrome-focused, Docker integration)
- **Next.js**: `next.config.mjs` (App Router, React Strict Mode)

## AWS Infrastructure

Managed via AWS CDK in `infrastructure/` directory:
- **CloudFront**: Global CDN with S3 origin
- **Route 53**: DNS management  
- **ACM**: SSL/TLS certificates
- **Parameter Store**: Secure configuration management
- **Resend**: Email service integration

## Research and Best Practices Guidelines

**CRITICAL**: Always ensure deeply researched and applied best practices using the latest library advanced tools and capabilities as of June 2025. Create a highly maintainable, low complexity, fully featured codebase that will be excellent to work on 6 months from now.

### Research Tools to Leverage
Before implementing ANY feature or making changes, use these tools to research best practices:
- **context7**: For library documentation and best practices
- **firecrawl tools**: firecrawl_search, firecrawl_crawl, firecrawl_scrape, firecrawl_extract, firecrawl_deep_research, firecrawl_map
- **tavily tools**: tavily-search and other tavily research tools
- **exa tools**: web_search_exa, exa github search, research paper search
- **linkup-search**: For real-time web research
- **Mental model tools**: sequentialthinking, mentalmodels, debuggingapproach, decisionframework, collaborativereasoning
- **Database tools**: neon and supabase tools for database best practices
- **GitHub tools**: For researching repository patterns and implementations

### Code Quality Standards
- **NO backwards compatibility**: Use the most recent, advanced, clean implementations
- **NO deprecated code**: Delete and replace old implementations entirely
- **NO transitional naming**: Avoid "simplified", "enhanced", "optimized", "advanced", "new", "old", "simple", "consolidated" in filenames when replacing deprecated code
- **Clean imports**: Update ALL imports when refactoring - no references to old files
- **Modern implementations**: Always use latest features, not legacy approaches
- **Low complexity**: Avoid over-engineering, keep solutions clean and maintainable

### Implementation Process
1. **Research first**: Use available tools to research current best practices
2. **Plan comprehensively**: Use mental model tools for decision-making
3. **Implement cleanly**: Write modern, maintainable code without legacy cruft
4. **Test thoroughly**: Update/rewrite tests for changed code, maintain 90% coverage
5. **Format and lint**: Run `pnpm lint` and `pnpm format` before finishing
6. **Verify completeness**: Ensure all imports updated, no broken references

### Database Integration
When working with databases, leverage:
- **Neon tools**: For PostgreSQL database operations and best practices
- **Supabase tools**: For full-stack database integration patterns
- Research current database schema patterns and migration strategies

### File Management Rules
- Delete deprecated files completely when replacing functionality
- Use clean, descriptive names for new implementations
- Ensure all imports and references are updated to new file locations
- No "bridge" or "compatibility" code between old and new implementations

## Important Notes

- E2E tests require Docker for consistent results across environments
- Always run `pnpm lint` and `pnpm format` before committing
- Contact form includes honeypot fields and GDPR consent mechanisms
- Feature flags system available in `src/lib/feature-flags/`
- All API routes include comprehensive error handling and security measures
- Research before implementing - use all available tools to ensure best practices
- Delete old code completely when implementing replacements