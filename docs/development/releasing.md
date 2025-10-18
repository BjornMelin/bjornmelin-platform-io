# Releasing (LLM-assisted)

This repository uses a Codex-assisted workflow to create GitHub Releases automatically.

## How it works

1. The workflow `.github/workflows/auto-release.yml` runs on push to `main` or manual dispatch, computes a SemVer
   floor, and asks Codex to decide the final bump from the full diff.
2. It then bumps `package.json` on a new branch `release/bump-vX.Y.Z` and opens a Release PR.
3. When the Release PR is merged to `main` (branch protection satisfied), `.github/workflows/finalize-release.yml` tags
   that merge commit and publishes the GitHub Release with auto‑generated notes.

## Setup

1. Add your OpenAI API key as a GitHub Actions secret:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions.
   - Click "New repository secret".
   - Name: `OPENAI_API_KEY`
   - Value: your OpenAI API key.
   - Save.
2. Ensure branch protection is enabled for `main` (status checks, reviews, etc.). The release flow opens a PR and relies
   on your protection rules.
3. Optionally adjust categories for auto-generated notes in `.github/release.yml`.

## Controls and overrides

- `release:skip` label — Skip creating a release for a PR.
- `semver:override-[major|minor|patch]` — Force a bump when needed.
- `release` — Applied to the Release PR automatically.

## Manual release (on demand)

- Use the workflow dispatch on `Auto Release (PR)` to generate a new Release PR any time.

## Notes

- The finalize workflow publishes releases (not drafts).
- Artifacts include the deterministic precheck and Codex decision JSON for audit.
- `.github/release.yml` — Controls the categories in auto‑generated release notes.

## Safety and audit

- Codex runs under reduced privileges; release creation uses `GITHUB_TOKEN`.
- The workflow uploads the precheck result and Codex JSON as artifacts for audit.

## Manual release

- Use the workflow dispatch on `Auto Release` to generate a release draft on demand.
