# Specifications (SPECs)

This directory contains implementation specifications. Specs complement ADRs by defining acceptance
criteria, file-level contracts, and operational details.

## Index

- SPEC-0000: Template
- SPEC-0001: Dependency upgrades
- SPEC-0002: Vitest testing coverage and practices
- SPEC-0003: Playwright E2E coverage and practices
- SPEC-0004: Static image pipeline (build-time variants + loader)
- SPEC-0005: Static export deployment pipeline (CSP + S3/CloudFront)
- SPEC-0006: CSP hashes via CloudFront Function + KeyValueStore (KVS)
- SPEC-0007: Deploy workflow permissions drift (ListExports + CSP KVS)
- SPEC-0008: Tailwind CSS v4 (CSS-first config) integration
- SPEC-0009: Projects page

## Conventions

- Filenames are `SPEC-XXXX-<kebab-title>.md`.
- Specs include a decision framework score (must be **≥ 9.0 / 10.0** for finalized specs).
- Requirement IDs referenced by specs are defined in `docs/specs/requirements.md`.
