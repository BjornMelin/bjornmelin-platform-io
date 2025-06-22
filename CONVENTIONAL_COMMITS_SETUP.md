# Conventional Commits Setup Summary

This project has been configured with conventional commits using commitlint and husky.

## What was implemented:

### 1. Dependencies Installed
- `@commitlint/cli` - The commitlint CLI tool
- `@commitlint/config-conventional` - Conventional commit configuration
- `husky` - Git hooks management

### 2. Configuration Files Created

#### `commitlint.config.js`
- Extends the conventional commit configuration
- Defines allowed commit types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test
- Sets subject line rules (10-100 characters, lowercase, no period)
- Configures body and footer formatting rules

#### `.husky/commit-msg`
- Runs commitlint on commit messages
- Prevents commits that don't follow the conventional format

#### `.husky/pre-commit`
- Runs formatting checks and auto-fixes if needed
- Runs linting with Biome
- Runs TypeScript type checking

#### `.gitmessage`
- Commit message template with guidelines
- Can be used with `git config --local commit.template .gitmessage`

#### `docs/development/conventional-commits.md`
- Comprehensive guide for developers
- Examples of good and bad commit messages
- Common scopes for this project

## How to use:

### Basic commit format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples:
```bash
# Feature
git commit -m "feat: add user authentication"

# Bug fix with scope
git commit -m "fix(api): handle null response from contact endpoint"

# Breaking change
git commit -m "feat!: change API response format

BREAKING CHANGE: The API now returns data in a different structure."
```

### Testing the setup:
```bash
# This will fail
echo "bad commit" | npx commitlint

# This will pass
echo "feat: add new feature" | npx commitlint
```

## Benefits:
1. **Consistent commit history** - All commits follow the same format
2. **Automated changelog generation** - Can be used with tools like semantic-release
3. **Better collaboration** - Clear commit messages help team members understand changes
4. **Automated versioning** - Commit types can determine version bumps
5. **Improved code review** - Reviewers can quickly understand the purpose of changes

## Next steps:
- Team members should review the conventional commits guide
- Consider adding semantic-release for automated versioning
- Update CI/CD pipelines to validate commit messages