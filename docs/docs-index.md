# Documentation

Welcome to the bjornmelin-platform-io documentation. This documentation is organized into several main sections:

## 📚 Contents

- [`/architecture`](./architecture/README.md) - System design and AWS infrastructure
- [`/development`](./development/README.md) - Development guides and practices
- [`/deployment`](./deployment/README.md) - Deployment and CI/CD processes
- [`/api`](./api/README.md) - API documentation and usage guides
- [`/security`](./security/README.md) - Security practices and configurations

## 📁 Directory Structure

```
docs/
├── architecture/
│   ├── README.md              # Architecture overview
│   ├── aws-services.md        # AWS services documentation
│   ├── frontend.md            # Frontend architecture
│   ├── backend.md             # Backend architecture
│   └── infrastructure.md      # Infrastructure design
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
│   ├── authentication.md      # Auth endpoints
│   ├── portfolio.md           # Portfolio endpoints
│   └── schemas.md            # Data schemas
│
├── security/
│   ├── README.md              # Security overview
│   ├── auth-flow.md          # Authentication flows
│   ├── secrets.md            # Secrets management
│   └── compliance.md         # Security compliance
│
└── README.md                 # This documentation index
```

## 🚀 Getting Started

For new developers, we recommend following these documentation sections in order:

1. [Development Getting Started](./development/getting-started.md)
2. [Architecture Overview](./architecture/README.md)
3. [Security Practices](./security/README.md)
4. [API Documentation](./api/README.md)

## 📖 Documentation Updates

This documentation is maintained alongside the codebase. When making changes:

1. Update relevant documentation with code changes
2. Follow the markdown style guide
3. Include diagrams where helpful
4. Update the table of contents when adding new sections

## 🔍 Quick References

- [AWS Services Overview](./architecture/aws-services.md)
- [Development Environment Setup](./development/getting-started.md)
- [Deployment Process](./deployment/ci-cd.md)
- [Security Best Practices](./security/README.md)

## Generating Repository Text for AI Models

To generate a comprehensive text representation of the relevant parts of this repository for use with generative AI models, you can use the `repomix` command. This command will include specific directories and files that are essential for understanding the project's structure and functionality.

### Command

```bash
repomix --include src,infrastructure,prisma,public,.vscode,.github/workflows/deploy.yml,.eslintrc.json,.gitignore,components.json,next.config.mjs,package.json,postcss.config.mjs,README.md,tailwind.config.ts,tsconfig.json
```

### Explanation of Included Components

- **src**: Contains the main source code of the application.
- **infrastructure**: Includes infrastructure-related configurations and scripts.
- **prisma**: Contains the Prisma schema and migration files.
- **public**: Holds static assets that are served directly.
- **.vscode**: Contains Visual Studio Code settings specific to the project.
- **.github/workflows/deploy.yml**: GitHub Actions workflow for deployment.
- **.eslintrc.json**: ESLint configuration file for code linting.
- **.gitignore**: Specifies files and directories to be ignored by Git.
- **components.json**: A JSON representation of the components used in the project.
- **next.config.mjs**: Configuration file for Next.js.
- **package.json**: Contains metadata about the project and its dependencies.
- **postcss.config.mjs**: Configuration for PostCSS.
- **README.md**: The main documentation file for the project.
- **tailwind.config.ts**: Configuration file for Tailwind CSS.
- **tsconfig.json**: TypeScript configuration file.

### Usage

Run the command in your terminal from the root of the repository to generate the text output. This output can then be fed into generative AI models to assist with development tasks, code suggestions, or documentation generation.
