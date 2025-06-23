# Naming Conventions Guide

This guide outlines the naming conventions used across the bjornmelin-platform-io project.

## File Naming Standards

### Documentation Files

1. **Kebab-case for all documentation files**
   - Use lowercase letters with hyphens as word separators
   - Examples: `naming-conventions.md`, `testing-guide.md`, `api-reference.md`

2. **GitHub Convention Files (Root Level)**
   - Keep uppercase for GitHub-recognized files in the root directory:
     - `README.md`
     - `CONTRIBUTING.md`
     - `LICENSE`
     - `CODE_OF_CONDUCT.md`
   - These files follow GitHub's community standards and should remain uppercase

3. **Documentation Structure**
   - `/docs/` - Main documentation directory
   - `/docs/api/` - API documentation
   - `/docs/architecture/` - Architecture decisions and diagrams
   - `/docs/deployment/` - Deployment guides
   - `/docs/development/` - Development guides and conventions
   - `/docs/infrastructure/` - Infrastructure documentation

### Code Files

1. **TypeScript/JavaScript Files**
   - Use camelCase for file names: `contactForm.tsx`, `emailService.ts`
   - Test files: `contactForm.test.tsx`, `emailService.test.ts`
   - Type definition files: `types.ts`, `interfaces.ts`

2. **React Components**
   - Component files use PascalCase: `ContactForm.tsx`, `NavigationBar.tsx`
   - Hooks use camelCase with 'use' prefix: `useContactForm.ts`

3. **Infrastructure as Code**
   - CDK stacks use PascalCase: `WebStack.ts`, `EmailStack.ts`
   - Configuration files use kebab-case: `cdk-config.json`

### Directory Naming

1. **Source Directories**
   - Use lowercase: `src/`, `tests/`, `docs/`
   - Feature directories use kebab-case: `contact-form/`, `email-service/`

2. **Component Directories**
   - Match component name in PascalCase: `ContactForm/`, `NavigationBar/`

### Configuration Files

1. **Tool Configuration**
   - Use the tool's conventional naming:
     - `.gitignore`
     - `package.json`
     - `tsconfig.json`
     - `vitest.config.ts`
     - `playwright.config.ts`

2. **Environment Files**
   - Use uppercase with underscores: `.env.LOCAL`, `.env.PRODUCTION`

## Consistency Guidelines

1. **Be Consistent Within Context**
   - Documentation: Always kebab-case
   - Components: Always PascalCase
   - Utilities: Always camelCase

2. **Follow Tool Conventions**
   - Respect the naming conventions of the tools and frameworks being used
   - When in doubt, follow the most common pattern in the community

3. **Clarity Over Brevity**
   - Use descriptive names that clearly indicate the file's purpose
   - Avoid abbreviations unless they're widely understood

## Migration Notes

This project underwent a naming convention standardization in Phase 2.5, where:
- All UPPERCASE documentation files (except root GitHub files) were converted to kebab-case
- Files were reorganized to appropriate subdirectories
- Internal links were updated to reflect new paths

When adding new files, please follow these conventions to maintain consistency across the project.