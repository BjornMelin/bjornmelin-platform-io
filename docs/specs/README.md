# Specifications (SPECs)

This directory contains implementation specifications. Specs complement ADRs by defining acceptance
criteria, file-level contracts, and operational details.

## Index

- SPEC-0001: Dependency upgrades
- SPEC-0002: Vitest testing coverage and practices
- SPEC-0003: Playwright E2E coverage and practices
- SPEC-0004: Static image pipeline (build-time variants + loader)
- SPEC-0005: Static export deployment pipeline (CSP + S3/CloudFront)
- SPEC-0006: CSP hashes via CloudFront Function + KeyValueStore (KVS)

## Conventions

- Filenames are `SPEC-XXXX-<kebab-title>.md`.
- Specs include a decision framework score (must be **≥ 9.0 / 10.0** for finalized specs).
