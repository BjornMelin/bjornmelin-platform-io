# Releasing

This repository uses [release-please](https://github.com/googleapis/release-please)
for automated semantic versioning and releases.

## How It Works

1. **Conventional Commits**: Write commits following the [Conventional Commits](https://www.conventionalcommits.org/) specification
2. **Release PR**: When you push to `main`, release-please automatically opens/updates a Release PR
3. **Merge to Release**: When the Release PR is merged, release-please creates a git tag and GitHub Release

## Commit Message Format

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | PATCH (1.0.x) | `fix: resolve navigation bug` |
| `feat:` | MINOR (1.x.0) | `feat: add dark mode toggle` |
| `feat!:` or `BREAKING CHANGE` footer | MAJOR (x.0.0) | `feat!: redesign API endpoints` |

### Examples

```bash
# Patch release (bug fix)
git commit -m "fix: correct typo in homepage"

# Minor release (new feature)
git commit -m "feat: add contact form validation"

# Major release (breaking change)
git commit -m "feat!: remove deprecated API endpoints"

# Or with footer
git commit -m "feat: migrate to new auth system

BREAKING CHANGE: OAuth tokens from v1 are no longer valid"
```

## Manual Version Override

To force a specific version, use the `Release-As` footer:

```bash
git commit --allow-empty -m "chore: release 2.0.0

Release-As: 2.0.0"
```

## Guardrails (Important)

### Do not create GitHub Releases or tags manually

Release-please uses existing Git tags/releases as the boundary for “what’s already released”.
If you create a GitHub Release (or tag) manually, you can accidentally change that boundary and
cause the open Release PR to be rewritten with a different version and different notes.

If you need to adjust the next version, do it via commit history (Conventional Commits) or the
`Release-As:` footer, and let release-please own tags/releases.

### Manually re-running release-please

The Release Please workflow supports `workflow_dispatch`, so you can re-run it without creating
any new commits on `main`:

- GitHub UI: Actions -> Release Please -> Run workflow
- CLI: `gh workflow run release-please.yml`

## Configuration Files

| File | Purpose |
|------|---------|
| `release-please-config.json` | Release-please configuration (release type, changelog sections) |
| `.release-please-manifest.json` | Tracks current version (updated automatically) |
| `.github/workflows/release-please.yml` | GitHub Actions workflow |

## What Gets Updated on Release

- `package.json` version field
- `CHANGELOG.md` (created/updated with release notes)
- Git tag (e.g., `v1.1.0`)
- GitHub Release with changelog
