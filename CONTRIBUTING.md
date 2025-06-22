# Contributing to bjornmelin-platform-io

First off, thank you for considering contributing to this project! 🎉

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and considerate in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible using the issue template.

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing code style
6. Issue that pull request!

## Development Setup

1. **Prerequisites**
   - Node.js 20+
   - pnpm 9+
   - Git

2. **Setup**
   ```bash
   # Clone your fork
   git clone https://github.com/your-username/bjornmelin-platform-io.git
   cd bjornmelin-platform-io

   # Install dependencies
   pnpm install

   # Create environment file
   cp .env.example .env.local
   ```

3. **Development Commands**
   ```bash
   # Start development server
   pnpm dev

   # Run tests
   pnpm test

   # Run E2E tests
   pnpm test:e2e

   # Run linting
   pnpm lint

   # Run formatting
   pnpm format

   # Type checking
   pnpm type-check

   # Build project
   pnpm build
   ```

## Style Guidelines

### Git Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### TypeScript

- Use TypeScript for all new code
- Ensure no TypeScript errors with `pnpm type-check`
- Prefer interfaces over types where possible
- Use explicit return types for functions
- Avoid using `any` type

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use Next.js App Router patterns
- Implement proper error boundaries
- Ensure components are accessible

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## Project Structure

```
bjornmelin-platform-io/
├── src/               # Application source code
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and libraries
│   └── styles/       # Global styles
├── public/           # Static assets
├── tests/            # Test files
├── e2e/              # E2E test files
├── infrastructure/   # AWS CDK infrastructure code
└── scripts/          # Build and utility scripts
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation with any new environment variables, exposed ports, etc.
3. The PR will be merged once you have the sign-off of the maintainer
4. Ensure all CI checks pass
5. Follow the PR template

## Recognition

Contributors will be recognized in the project README.

Thank you for contributing! 🙏