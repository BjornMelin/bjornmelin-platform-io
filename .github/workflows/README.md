# GitHub Actions Workflows

This directory contains all the GitHub Actions workflows for the bjornmelin-platform-io project.

## Workflows Overview

### Core CI/CD

1. **ci.yml** - Main continuous integration workflow
   - Runs on: Push to main/develop, PRs
   - Jobs: Lint, type check, unit tests, E2E tests, build
   - Features: pnpm caching, parallel jobs, artifact uploads

2. **release.yml** - Automated release workflow using semantic-release
   - Runs on: Push to main
   - Features: Automatic versioning, changelog generation, GitHub releases
   - Requires: GITHUB_TOKEN, NPM_TOKEN (if publishing)

3. **manual-deploy.yml** - Manual deployment workflow
   - Runs on: Workflow dispatch
   - Features: Environment selection, test skipping option, deployment tracking

### Security & Quality

4. **codeql.yml** - GitHub CodeQL security analysis
   - Runs on: Push, PRs, weekly schedule
   - Scans: JavaScript/TypeScript code for vulnerabilities

5. **security-audit.yml** - Dependency security audit
   - Runs on: Push, PRs, daily schedule
   - Features: pnpm audit, dependency review

6. **dependency-update.yml** - Automated dependency updates
   - Runs on: Weekly schedule
   - Features: Non-major updates, automated PR creation

### Maintenance

7. **branch-protection.yml** - PR validation and protection
   - Runs on: Pull requests to main
   - Features: Conventional commit check, merge conflict detection, auto-labeling

8. **pr-labeler.yml** - Automatic PR labeling
   - Runs on: PR opened/edited
   - Features: Path-based labels, conventional commit labels

9. **stale.yml** - Manage stale issues and PRs
   - Runs on: Daily schedule
   - Features: Auto-close inactive items, configurable timelines

10. **link-check.yml** - Check for broken links
    - Runs on: Push, PRs, weekly schedule
    - Features: Markdown link validation, issue creation on failure

11. **workflow-status.yml** - Monitor workflow health
    - Runs on: Weekly schedule
    - Features: Success rate tracking, stale workflow detection

### Testing

12. **test-matrix.yml** - Cross-platform testing
    - Runs on: Push, PRs
    - Matrix: Node 20/21/22, Ubuntu/Windows/macOS
    - Features: Comprehensive compatibility testing

### Performance

13. **performance-check.yml** - Performance monitoring
    - Runs on: Push to main, PRs
    - Features: Lighthouse CI, bundle size analysis
    - Metrics: Performance, accessibility, SEO, best practices

## Configuration Files

- **dependabot.yml** - Dependabot configuration for automated dependency updates
- **auto-assign.yml** - Auto-assignment configuration for PRs
- **labeler.yml** - Path-based labeling configuration
- **lighthouse/lighthouserc.json** - Lighthouse CI configuration

## Environment Variables & Secrets

Required secrets:
- `GITHUB_TOKEN` - Automatically provided by GitHub
- `CODECOV_TOKEN` - For code coverage reporting (optional)
- `NPM_TOKEN` - For npm publishing (if applicable)
- `AWS_DEPLOY_ROLE_ARN` - For AWS deployments (if using)

## Branch Protection Settings

Recommended branch protection for `main`:
- Require PR reviews (1+)
- Dismiss stale PR approvals
- Require status checks:
  - CI / All CI Checks Passed
  - CodeQL / Analyze
  - Security Audit / Security Audit
- Require branches to be up to date
- Include administrators
- Restrict who can push to matching branches

## Workflow Badges

Add these badges to your README:

```markdown
[![CI](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/ci.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/codeql.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/codeql.yml)
[![Security Audit](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/security-audit.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/security-audit.yml)
[![Release](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/release.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/release.yml)
```

## Best Practices

1. **Caching**: All workflows use pnpm caching for faster builds
2. **Concurrency**: Workflows use concurrency groups to cancel redundant runs
3. **Artifacts**: Test results and build artifacts are uploaded for debugging
4. **Matrix Testing**: Comprehensive testing across Node versions and OS platforms
5. **Security**: CodeQL, dependency audits, and automated updates
6. **Automation**: Auto-labeling, auto-assignment, and stale management

## Troubleshooting

If workflows fail:
1. Check the workflow logs in the Actions tab
2. Verify all required secrets are set
3. Ensure branch protection rules aren't blocking required checks
4. Check for pnpm lockfile issues with `pnpm install --frozen-lockfile`
5. Verify Node.js version compatibility

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from releases

# Test CI workflow
act -j lint-and-type-check

# Test with specific event
act pull_request

# List all workflows
act -l
```