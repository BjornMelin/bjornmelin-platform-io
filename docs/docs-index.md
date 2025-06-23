# Documentation Index

## Overview
This document serves as a comprehensive index for all documentation in the bjornmelin-platform-io project.

## 🚀 Quick Links
- 📖 [Contributing Guide](../CONTRIBUTING.md) - How to contribute to the project
- 🌳 [Branching Strategy](./development/branching-strategy.md) - Git workflow and branches
- 📋 [Onboarding Checklist](./development/onboarding-checklist.md) - New team member guide
- 🔄 [Git Workflow Guide](./development/git-workflow-guide.md) - Day-to-day Git operations
- 📊 [Workflow Diagrams](./development/workflow-diagrams.md) - Visual workflow guides
- 🧪 [Testing Guide](./development/testing.md) - Comprehensive testing documentation

## 📚 Documentation Structure

### 1. API Documentation
- [API Overview](./api/README.md) - Main API documentation
- [Contact API](./api/contact.md) - Contact form endpoint documentation  
- [Schemas](./api/schemas.md) - API schemas and validation
- [Utilities](./api/utilities.md) - Utility services and error handling

### 2. Architecture Documentation
- [Architecture Overview](./architecture/README.md) - System architecture overview
- [Frontend Architecture](./architecture/frontend.md) - Next.js and React architecture
- [Backend Architecture](./architecture/backend.md) - API and serverless functions
- [Infrastructure](./architecture/infrastructure.md) - AWS CDK and cloud resources
- [AWS Services](./architecture/aws-services.md) - AWS services integration

### 3. Infrastructure Documentation
- [Infrastructure Overview](./infrastructure/README.md) - AWS infrastructure and services
- [AWS Free Tier Optimization](./infrastructure/aws-free-tier-optimization-2025.md) - Cost optimization guide
- [Email Service Documentation](./infrastructure/email-service.md) - Comprehensive email service guide
- [Email Infrastructure Guide](./infrastructure/email-infrastructure-guide.md) - Email service implementation
- [Security Audit Checklist](./infrastructure/security-audit-checklist.md) - Security review procedures
- [Application Integration Examples](./infrastructure/application-integration-examples.md) - Code integration examples
- [Parameter Store Migration Guide](./infrastructure/parameter-store-migration-guide.md) - Cost-effective secrets management

### 4. Development Documentation  
- [Development Overview](./development/README.md) - Development process and standards
- [Getting Started](./development/getting-started.md) - Setup and initial development
- [Onboarding Checklist](./development/onboarding-checklist.md) - New team member onboarding
- [Branching Strategy](./development/branching-strategy.md) - Git flow and branch management
- [Conventional Commits](./development/conventional-commits.md) - Commit message standards
- [Coding Standards](./development/coding-standards.md) - Code style and best practices
- [Testing Guide](./development/testing.md) - Testing strategies and tools
- [Git Workflow Guide](./development/git-workflow-guide.md) - Quick reference for Git commands
- [Workflow Diagrams](./development/workflow-diagrams.md) - Visual workflow representations
- [Naming Conventions](./development/naming-conventions.md) - File and code naming standards
- [Semantic Release](./development/semantic-release.md) - Automated versioning and releases

### 5. Deployment Documentation
- [Deployment Overview](./deployment/README.md) - Deployment processes
- [CI/CD Pipeline](./deployment/ci-cd.md) - GitHub Actions and automation
- [Environments](./deployment/environments.md) - Development, staging, and production
- [Monitoring](./deployment/monitoring.md) - Application monitoring and alerting
- [Deployment Secrets Setup](./deployment/deployment-secrets-setup.md) - Secrets management guide

### 6. Testing Documentation
- [Testing Overview](./development/testing.md) - Comprehensive testing guide
- [Development Testing](./development/testing.md) - Development testing practices

### 7. Optional Features Documentation
- [AWS CodeArtifact Integration](./infrastructure/codeartifact-backup.md) - Enterprise-grade npm package backup solution (not deployed)

### 8. Additional Documentation
- [Feature Flags Implementation](./feature-flags-implementation-plan.md) - Feature flag system plan
- [Testing Documentation Fixes](./testing-documentation-fixes.md) - Phase 1.2 testing documentation updates
- [Phase 2.5 Summary](./development/phase-2.5-summary.md) - File naming standardization summary

### 9. Archived Documentation
- [Email Migration History](./archive/email/) - Historical email service migration documents
  - Email migration plan
  - Service comparison analysis (June 2025)
  - Migration implementation details
- [CodeArtifact Original Docs](./archive/codeartifact/) - Original CodeArtifact documentation
  - Integration plan
  - Implementation summary
  - Quick reference guide

## 📁 Directory Structure

```
bjornmelin-platform-io/
├── docs/
│   ├── api/                    # API documentation
│   │   ├── README.md          # API overview
│   │   ├── contact.md         # Contact endpoints
│   │   ├── schemas.md         # Data schemas
│   │   └── utilities.md       # Utility services
│   │
│   ├── architecture/          # System architecture
│   │   ├── README.md         # Architecture overview
│   │   ├── frontend.md       # Frontend design
│   │   ├── backend.md        # Backend design
│   │   ├── infrastructure.md # AWS infrastructure
│   │   └── aws-services.md   # AWS services used
│   │
│   ├── infrastructure/       # Infrastructure docs
│   │   ├── README.md         # Infrastructure overview
│   │   ├── aws-free-tier-optimization-2025.md # Cost optimization
│   │   ├── email-service.md  # Email service documentation
│   │   ├── email-infrastructure-guide.md # Email setup
│   │   ├── security-audit-checklist.md # Security review
│   │   ├── application-integration-examples.md # Code examples
│   │   ├── parameter-store-migration-guide.md # Secrets management
│   │   └── codeartifact-backup.md # Optional CodeArtifact feature
│   │
│   ├── development/          # Development guides
│   │   ├── README.md         # Development overview
│   │   ├── getting-started.md # Setup guide
│   │   ├── onboarding-checklist.md # New member guide
│   │   ├── branching-strategy.md # Git workflow
│   │   ├── conventional-commits.md # Commit standards
│   │   ├── coding-standards.md # Code style
│   │   ├── testing.md        # Testing guide
│   │   ├── semantic-release.md # Release automation
│   │   ├── naming-conventions.md # Naming standards
│   │   ├── git-workflow-guide.md # Git commands
│   │   ├── workflow-diagrams.md # Visual guides
│   │   └── phase-2.5-summary.md # Naming standardization
│   │
│   ├── deployment/           # Deployment docs
│   │   ├── README.md        # Deployment overview
│   │   ├── ci-cd.md         # CI/CD pipeline
│   │   ├── environments.md  # Environment setup
│   │   ├── monitoring.md    # Monitoring guide
│   │   └── deployment-secrets-setup.md # Secrets management
│   │
│   ├── archive/             # Archived documentation
│   │   ├── email/          # Email migration history
│   │   │   ├── email-migration-plan.md
│   │   │   ├── email-service-comparison-2025.md
│   │   │   └── email-service-migration.md
│   │   └── codeartifact/   # Original CodeArtifact docs
│   │       ├── codeartifact-integration.md
│   │       ├── codeartifact-implementation-summary.md
│   │       └── README-codeartifact.md
│   │
│   ├── feature-flags-implementation-plan.md # Feature flags
│   ├── testing-documentation-fixes.md # Testing doc updates
│   └── docs-index.md        # This file
│
├── CONTRIBUTING.md          # Contribution guidelines
└── README.md               # Project overview
```

## 🎯 Getting Started Path

### For New Team Members:
1. 📋 [Onboarding Checklist](./development/onboarding-checklist.md) - Complete setup
2. 📖 [Contributing Guide](../CONTRIBUTING.md) - Understand workflow
3. 🌳 [Branching Strategy](./development/branching-strategy.md) - Learn Git flow
4. 🔧 [Getting Started](./development/getting-started.md) - Development setup
5. 📊 [Workflow Diagrams](./development/workflow-diagrams.md) - Visual understanding

### For Contributors:
1. 📖 [Contributing Guide](../CONTRIBUTING.md) - Contribution process
2. 🔄 [Git Workflow Guide](./development/git-workflow-guide.md) - Git commands
3. 📝 [Conventional Commits](./development/conventional-commits.md) - Commit format
4. 🧪 [Testing Guide](./development/testing.md) - Test requirements

### For Architects:
1. 🏗️ [Architecture Overview](./architecture/README.md) - System design
2. ☁️ [AWS Services](./architecture/aws-services.md) - Cloud services
3. 🚀 [Infrastructure](./architecture/infrastructure.md) - CDK setup
4. 📡 [API Documentation](./api/README.md) - API design

## 📖 Documentation Standards

When updating documentation:
1. Use clear, concise language
2. Include code examples where helpful
3. Add diagrams for complex concepts
4. Keep navigation structure intact
5. Update this index when adding new docs
6. Follow markdown best practices
7. Test all code snippets

## 🔍 Search Tips

- Use `Cmd/Ctrl + F` to search within documents
- Check the table of contents first
- Look for visual diagrams in workflow-diagrams.md
- Reference the quick links for common tasks

## 📈 Continuous Improvement

This documentation evolves with the project. Please:
- Report outdated information
- Suggest improvements
- Add missing documentation
- Fix errors when found

Last updated: Check git history for latest changes