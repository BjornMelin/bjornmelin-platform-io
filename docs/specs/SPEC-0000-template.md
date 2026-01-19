---
spec: SPEC-0000
title: <concise spec title>
version: 0.1.0
date: <YYYY-MM-DD>
owners: ["<owner>"]
status: <Draft|Proposed|Implemented|Deprecated>
related_requirements: ["FR-000", "NFR-000"]
related_adrs: ["ADR-0000"]
notes: "<one-line purpose or scope statement>"
---

## Summary

[1–3 sentence executive summary of what this spec defines.]

## Context

[Why this spec exists, current state, and constraints it must respect.]

## Goals / Non-goals

### Goals

- [Goal 1]
- [Goal 2]

### Non-goals

- [Explicitly out of scope item]

## Requirements

Requirement IDs are defined in `docs/specs/requirements.md`.

### Functional requirements

- **FR-XXX:** [Requirement description]

### Non-functional requirements

- **NFR-XXX:** [Requirement description]

### Performance / Reliability requirements (if applicable)

- **PR-XXX:** [Requirement description]

### Integration requirements (if applicable)

- **IR-XXX:** [Requirement description]

## Constraints

- [Static export/runtime constraints]
- [Policy or security constraints]
- [Operational constraints]

## Decision Framework Score (must be ≥ 9.0)

| Criterion | Weight | Score | Weighted |
| --- | --- | --- | --- |
| Solution leverage | 0.35 | [0-10] | [auto] |
| Application value | 0.30 | [0-10] | [auto] |
| Maintenance & cognitive load | 0.25 | [0-10] | [auto] |
| Architectural adaptability | 0.10 | [0-10] | [auto] |

**Total:** [≥ 9.0] / 10.0

## Design

[Overview of the intended implementation. Include diagrams or code snippets if helpful.]

### Architecture overview

[Key components and interactions.]

### Data contracts (if applicable)

- [Input/Output shapes, file formats, or APIs]

### File-level contracts

- `[path]`: [expected behavior or invariants]

### Configuration

- [Env vars, build flags, or config files]

## Acceptance criteria

- [Behavioral outcome]
- [Operational outcome]
- [Regression guard]

## Testing

- Unit tests: [paths or expectations]
- Integration tests: [paths or expectations]
- E2E tests: [paths or expectations]

## Operational notes

- [Deployment sequencing, runbooks, or guardrails]
- [Monitoring or verification steps]

## Failure modes and mitigation

- [Failure mode] → [Mitigation]

## Key files

- `[path]`
- `[path]`

## References

- [Official docs or ADR links]

## Changelog

- **0.1 (YYYY-MM-DD)**: Initial draft.
