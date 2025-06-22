# Conventional Commits Guide

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure consistent commit messages that can be used for automated versioning and changelog generation.

## Quick Reference

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **build**: Changes that affect the build system or external dependencies (example scopes: pnpm, vite, next)
- **chore**: Other changes that don't modify src or test files
- **ci**: Changes to CI configuration files and scripts (example scopes: github-actions, docker)
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **revert**: Reverts a previous commit
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **test**: Adding missing tests or correcting existing tests

### Examples

#### Simple Examples

```bash
# Feature
git commit -m "feat: add user authentication"

# Bug fix with scope
git commit -m "fix(api): handle null response from contact endpoint"

# Documentation
git commit -m "docs: update README with new build instructions"

# Breaking change
git commit -m "feat!: change API response format

BREAKING CHANGE: The API now returns data in a different structure.
Old format: { result: data }
New format: { data: data, meta: {} }"
```

#### Complex Example with Body and Footer

```bash
git commit -m "fix(contact): validate email format before sending

The contact form was allowing invalid email formats which caused
errors in the SES service. This fix adds proper email validation
using Zod schema before attempting to send.

- Added email regex validation
- Improved error messages for users
- Added unit tests for email validation

Closes #123"
```

## Commit Message Rules

1. **Type** is mandatory and must be one of the allowed types
2. **Scope** is optional but recommended for clarity
3. **Subject** must:
   - Use imperative mood ("add" not "added" or "adds")
   - Start with lowercase
   - Not end with a period
   - Be between 10-100 characters
4. **Body** is optional but recommended for complex changes
5. **Footer** is optional, used for breaking changes and issue references

## Git Configuration

To use the commit message template:

```bash
git config --local commit.template .gitmessage
```

## Validation

All commits are automatically validated by commitlint via a git hook. If your commit message doesn't follow the convention, it will be rejected with an error message explaining what needs to be fixed.

## Tips

1. **Think about the type first**: What kind of change is this?
2. **Consider the scope**: What part of the codebase does this affect?
3. **Write clear subjects**: Someone should understand the change from the subject alone
4. **Add context in the body**: Explain why, not just what
5. **Reference issues**: Link commits to issues for better tracking

## Common Mistakes to Avoid

❌ `Fixed the bug` - Not descriptive, wrong tense, missing type
✅ `fix: resolve race condition in contact form submission`

❌ `feat: Added new feature.` - Capitalized, has period, vague
✅ `feat: add dark mode toggle to navigation`

❌ `update code` - Missing type, too vague
✅ `refactor: extract email validation into separate utility`

## Scope Suggestions

While scope is flexible, here are some common ones for this project:

- **api**: API routes and backend logic
- **ui**: UI components and styling
- **auth**: Authentication related changes
- **db**: Database schemas and queries
- **deps**: Dependency updates
- **config**: Configuration changes
- **test**: Test-specific changes
- **docs**: Documentation updates
- **infra**: Infrastructure and deployment