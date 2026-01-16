---
ADR: <zero-padded number>
Title: <concise decision>
Status: <Proposed|Accepted|Deprecated|Superseded>
Version: <X.Y>
Date: <YYYY-MM-DD>
Supersedes: <ADR-IDs>
Superseded-by: <ADR-IDs>
Related: <ADR-IDs>
Tags: <e.g., architecture, streamlit, orchestration, auth, embeddings, agents, retrieval>
References: <official docs and key sources as markdown links>
---

## Description

[1–2 sentence executive summary]

## Context

[Describe the problem or need being addressed, the current state, and any technical or business constraints.]

## Decision Drivers

- [Driver 1]
- [Driver 2]
- [Regulatory/Policy] (e.g., EU AI Act, internal policies)

## Alternatives

- A: [desc] — Pros / Cons
- B: [desc] — Pros / Cons
- C: [desc] — Pros / Cons

### Decision Framework

| Option | Criterion 1 (Weight: X%) | Criterion 2 (Weight: Y%) | Criterion 3 (Weight: Z%) | Total Score | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[Chosen Solution]** | [Score] | [Score] | [Score] | **[Score]** | ✅ **Selected** |
| [Alternative Option A] | [Score] | [Score] | [Score] | [Score] | Rejected |

## Decision

We will adopt **[Chosen Solution]** to address [the problem]. This involves using
**[Specific Library/Pattern/Component]** configured with **[Key Parameters]**.

## High-Level Architecture

[Mermaid Diagram or textual description of the architecture]

## Related Requirements

### Functional Requirements

- **FR-1:** [Requirement description]

### Non-Functional Requirements

- **NFR-1:** [Requirement description]

### Performance Requirements

- **PR-1:** [Requirement description]

### Integration Requirements

- **IR-1:** [Requirement description]

## Design

[Provide an overview of the implementation. Include diagrams or code snippets if helpful for clarity.]

### Architecture Overview

[Visual or textual description of component interaction.]

### Implementation Details

[Specific details about file changes, function names, or logic. Code snippets are recommended for complex changes.]

### Configuration

[Detail any new environment variables or settings.]

## Testing

[Describe the strategy for testing the new architecture. Include skeleton code for tests if appropriate.]

## Consequences

### Positive Outcomes

- [Benefit 1]

### Negative Consequences / Trade-offs

- [Trade-off 1]

### Ongoing Maintenance & Considerations

- [Maintenance task or risk to monitor]

### Dependencies

- **Added**: [pnpm packages, system tools, etc.]
- **Removed**: [unused dependencies]

## Changelog

- **0.1 (YYYY-MM-DD)**: Initial version.
