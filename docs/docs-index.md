# Documentation

Documentation for bjornmelin-platform-io. Organized into the following sections:

## Contents

- [`/architecture`](./architecture/README.md) - System design and AWS infrastructure
- [`/development`](./development/README.md) - Development guides and practices
- [`/deployment`](./deployment/README.md) - Deployment and CI/CD processes
- [`/api`](./api/README.md) - API documentation and usage guides
- [`/specs`](./specs/) - Specifications and historical plans

## Directory Structure

```text
docs/
├── architecture/
│   ├── README.md              # Architecture overview
│   ├── aws-services.md        # AWS services documentation
│   ├── frontend.md            # Frontend architecture (Next.js)
│   ├── infrastructure.md      # Infrastructure design
│   └── adr/                   # Architecture Decision Records
│       ├── ADR-0001-*.md
│       ├── ADR-0002-*.md
│       ├── ADR-0003-*.md
│       ├── ADR-0004-*.md
│       └── ADR-0005-*.md
│
├── development/
│   ├── README.md              # Development overview
│   ├── getting-started.md     # Setup guide
│   ├── coding-standards.md    # Code style and practices
│   └── testing.md             # Testing strategies
│
├── deployment/
│   ├── README.md              # Deployment overview
│   ├── environments.md        # Environment configurations
│   ├── ci-cd.md              # CI/CD pipeline documentation
│   └── monitoring.md         # Monitoring and logging
│
├── api/
│   ├── README.md              # API overview
│   ├── contact.md             # Contact form endpoints
│   └── schemas.md            # Data schemas
│
├── specs/
│   ├── SPEC-0001-*.md
│   ├── SPEC-0002-*.md
│   ├── SPEC-0003-*.md
│   └── (add more specs as needed)
│
└── README.md                 # This documentation index
```

## Getting Started

For new developers, follow these documentation sections in order:

1. [Development Getting Started](./development/getting-started.md)
2. [Architecture Overview](./architecture/README.md)
3. [API Documentation](./api/README.md)

## Documentation Updates

This documentation is maintained alongside the codebase. When making changes:

1. Update relevant documentation with code changes
2. Follow the markdown style guide
3. Include diagrams where helpful
4. Update the table of contents when adding new sections

## Quick References

- [AWS Services Overview](./architecture/aws-services.md)
- [Development Environment Setup](./development/getting-started.md)
- [Deployment Process](./deployment/ci-cd.md)
