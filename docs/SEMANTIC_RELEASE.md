# Semantic Release Configuration

This project uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) for automated version management and package publishing.

## Overview

Semantic-release automates the whole package release workflow including:
- Determining the next version number
- Generating the release notes
- Publishing the package

## Configuration Files

### `.releaserc.json` / `release.config.js`
The main configuration file that defines:
- Branch configuration (main, beta, alpha, next)
- Plugin configuration and ordering
- Release rules and commit parsing
- Changelog generation settings

### `commitlint.config.js`
Ensures all commits follow the conventional commit format required by semantic-release.

### `.github/workflows/release.yml`
GitHub Actions workflow that runs semantic-release on pushes to configured branches.

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: A new feature (MINOR version bump)
- `fix`: A bug fix (PATCH version bump)
- `perf`: Performance improvements (PATCH version bump)
- `refactor`: Code refactoring (PATCH version bump)
- `docs`: Documentation only changes (PATCH version bump if scope is README)
- `style`: Code style changes (no version bump)
- `test`: Adding or updating tests (no version bump)
- `build`: Build system changes (PATCH version bump for deps scope)
- `ci`: CI/CD changes (no version bump)
- `chore`: Other changes that don't modify src or test files (no version bump)
- `revert`: Reverts a previous commit (PATCH version bump)

### Breaking Changes
Add `BREAKING CHANGE:` in the footer or append `!` after the type/scope to trigger a MAJOR version bump.

Example:
```
feat!: remove support for Node.js 12

BREAKING CHANGE: Node.js 12 is no longer supported. Minimum version is now Node.js 16.
```

### Scopes
Suggested scopes include:
- `deps`: Dependency updates
- `deps-dev`: Dev dependency updates
- `api`: API changes
- `ui`: UI/UX changes
- `components`: Component changes
- `config`: Configuration changes
- `security`: Security improvements
- `performance`: Performance optimizations
- `accessibility`: Accessibility improvements
- `testing`: Testing infrastructure
- `build`: Build system
- `ci`: CI/CD pipeline
- `release`: Release process

## Branch Strategy

### Main Branch (`main`)
- Production releases
- Version format: `v1.0.0`
- Distribution tag: `@latest`

### Beta Branch (`beta`)
- Pre-release testing
- Version format: `v1.0.0-beta.1`
- Distribution tag: `@beta`

### Alpha Branch (`alpha`)
- Early development releases
- Version format: `v1.0.0-alpha.1`
- Distribution tag: `@alpha`

### Next Branch (`next`)
- Release candidates
- Version format: `v1.0.0-rc.1`
- Distribution tag: `@next`

## Local Development

### Testing Release Process
```bash
# Dry run to see what would be released
pnpm run semantic-release:dry-run

# Run semantic-release locally (not recommended for actual releases)
GITHUB_TOKEN=<your_token> pnpm run semantic-release --no-ci
```

### Commit Validation
Commits are automatically validated using commitlint. To test a commit message:
```bash
echo "feat: add new feature" | npx commitlint
```

## GitHub Actions Setup

The release workflow requires the following:

1. **Permissions**: The workflow has the necessary permissions set for:
   - Creating releases
   - Updating issues and PRs
   - Writing to the repository

2. **Secrets**: The `GITHUB_TOKEN` is automatically provided by GitHub Actions

3. **Branch Protection**: Consider protecting release branches to ensure only validated code is released

## Plugins Used

### @semantic-release/commit-analyzer
Analyzes commits to determine the release type using the conventionalcommits preset.

### @semantic-release/release-notes-generator
Generates release notes with sections for different types of changes.

### @semantic-release/changelog
Creates and updates the CHANGELOG.md file.

### @semantic-release/npm
Updates the version in package.json (npmPublish is disabled since this is a private package).

### @semantic-release/git
Commits release assets back to the repository.

### @semantic-release/github
Creates GitHub releases and manages release labels.

## Troubleshooting

### No Release Published
- Ensure you're on a configured branch (main, beta, alpha, next)
- Check that commits follow conventional format
- Verify GitHub Actions has necessary permissions

### Version Not Bumping
- Check commit messages follow the correct format
- Ensure breaking changes are properly marked
- Review the release rules in the configuration

### Dry Run Issues
- Make sure all dependencies are installed: `pnpm install`
- Check that the configuration files are valid JSON/JavaScript

## Best Practices

1. **Commit Messages**: Write clear, descriptive commit messages following the conventional format
2. **Breaking Changes**: Always document breaking changes in the commit body
3. **Scopes**: Use consistent scopes across the project
4. **PR Titles**: When squash merging, ensure the PR title follows conventional format
5. **Release Notes**: Review generated release notes for accuracy

## Resources

- [Semantic Release Documentation](https://semantic-release.gitbook.io/semantic-release/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)