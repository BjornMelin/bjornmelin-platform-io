# Operations Notes

These notes capture the essential steps to deploy, verify, and roll back the
portfolio site without maintaining a full runbook.

## Deployment

- Trigger GitHub Action `Deploy Portfolio` on `main` (push or manual dispatch).
- For manual runs, ensure the latest code is on `main`, then use **Run workflow**
  in the Actions tab.
- The workflow builds the static export (`out/`), deploys the Storage stack (CSP headers),
  then uploads `out/` to the `bjornmelin.io-prod-website` S3 bucket and invalidates CloudFront.

## Smoke Check

- CI runs a post-deploy smoke step that curls `https://bjornmelin.io`.
- Review the job summary or workflow notification for HTTP status and commit
  details.

## Rollback

- Re-run the `Deploy Portfolio` workflow selecting the previous good commit SHA
  in the manual dispatch form (or check out locally, push a revert).
- CloudFront invalidation is handled automatically; no additional action is
  required.

## Notifications

- Deployment workflow writes to the Actions job summary.
- GitHub email notifications are sent for failure states by default—ensure
  repository notifications are enabled.

## Quarterly Review

- Review this document, smoke-check script, and automation reminders every
  quarter (see tracking issue). Update if infrastructure or tooling changes.
