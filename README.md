# 🏗️ bjornmelin-platform-io

Cloud-native portfolio platform powering bjornmelin.io. Demonstrates AWS solutions architecture through serverless APIs and infrastructure as code. Built with React 18, Next.js 14, AWS CDK, and modern DevOps practices.

[![CI](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/ci.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/codeql.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/codeql.yml)
[![Security Audit](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/security-audit.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/security-audit.yml)
[![Release](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/release.yml/badge.svg)](https://github.com/bjornmelin/bjornmelin-platform-io/actions/workflows/release.yml)
[![codecov](https://codecov.io/gh/bjornmelin/bjornmelin-platform-io/branch/main/graph/badge.svg)](https://codecov.io/gh/bjornmelin/bjornmelin-platform-io)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![AWS SAA](https://img.shields.io/badge/AWS-Solutions%20Architect%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate)
[![AWS DVA](https://img.shields.io/badge/AWS-Developer%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-developer-associate)
[![AWS SysOps](https://img.shields.io/badge/AWS-SysOps%20Administrator%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-sysops-administrator-associate)
[![AWS ML](https://img.shields.io/badge/AWS-Machine%20Learning%20Engineer%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-machine-learning-engineer-associate)
[![AWS AIF](https://img.shields.io/badge/AWS-AI%20Practitioner-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-ai-practitioner)
[![AWS CCP](https://img.shields.io/badge/AWS-Cloud%20Practitioner-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-cloud-practitioner)
[![React](https://img.shields.io/badge/React-19_RC-blue?logo=react)](https://react.dev)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![GitHub](https://img.shields.io/badge/GitHub-BjornMelin-181717?logo=github)](https://github.com/BjornMelin)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bjorn%20Melin-0077B5?logo=linkedin)](https://www.linkedin.com/in/bjorn-melin/)
[![Coursera](https://img.shields.io/badge/Coursera-2A73CC?logo=coursera&logoColor=white)](https://www.coursera.org/learner/bjorn-melin)
[![Medium](https://img.shields.io/badge/Medium-000000?logo=medium&logoColor=white)](https://medium.com/@bjornmelin)

## 🌟 Features

### Core Platform Features

- 🏗️ **Cloud Native Architecture**: Production-grade AWS infrastructure with CDK
- 🔐 **Enterprise Security**: Zero-trust architecture with AWS Cognito
- 🚀 **CI/CD Pipeline**: Automated deployments with GitHub Actions
- 📊 **Observability**: Comprehensive monitoring and logging
- 🔄 **Multi-Environment**: Development, staging, and production
- 🛡️ **Infrastructure as Code**: Complete AWS CDK implementation
- 📱 **Modern Frontend**: Next.js with Tailwind CSS
- 🌐 **Global Delivery**: CloudFront CDN integration

### Modern Tech Features

- ⚡ **React 18 RC Integration**

  - Document Metadata API
  - Asset Loading API
  - Progressive Loading
  - Optimization Compiler

- 🚀 **Next.js 14 App Router**

  - Server Components
  - Partial Prerendering
  - Parallel Routes
  - Edge Runtime

- 🔄 **Full-Stack Type Safety**

  - End-to-end typesafe APIs with tRPC
  - Runtime validation
  - Strict TypeScript
  - Comprehensive error handling

- ⚡ Performance First

  - Edge deployment
  - Streaming SSR
  - Smart bundling
  - Optimal caching

## 📚 Quick Links

- [📑 Documentation Index](./docs/docs-index.md)
- [🏛️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ AWS Services Integration](#️-aws-services-integration)
- [📚 Documentation](#-documentation)
- [💻 Development Scripts](#-development-scripts)
- [👨‍💻 Author](#-author)
- [📜 License](#-license)
- [🌟 Star History](#-star-history)
- [📚 How to Reference](#-how-to-reference)
- [🙏 Acknowledgments](#-acknowledgments)

## 🏛️ Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Global Edge Network"
        CF[CloudFront Distribution]
    end

    subgraph "Frontend"
        S3[S3 Bucket]
        CF --> S3
    end

    subgraph "API Layer"
        API[Next.js API Routes]
        RESEND[Resend Email Service]
    end

    subgraph "DNS & SSL"
        R53[Route 53]
        ACM[ACM Certificate]
    end

    CF --> API
    API --> RESEND
    R53 --> CF
    ACM --> CF
```

### Contact Form Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Resend

    User->>Frontend: Submit Contact Form
    Frontend->>API: POST /api/contact
    API->>Resend: Send Email
    Resend-->>API: Email Sent
    API-->>Frontend: Success Response
    Frontend-->>User: Show Success Message
```

### DNS & CDN Setup

```mermaid
graph LR
    subgraph "DNS Management"
        R53[Route 53]
        ZONE[Hosted Zone]
    end

    subgraph "Content Delivery"
        CF[CloudFront]
        S3[S3 Origin]
        ACM[SSL Certificate]
    end

    R53 --> CF
    CF --> S3
    ACM --> CF
```

## 📁 Project Structure

```bash
bjornmelin-platform-io/
├── .github/                # GitHub Actions workflows
├── docs/                  # Project documentation
│   ├── api/              # API documentation
│   ├── architecture/     # Architecture docs
│   ├── deployment/       # Deployment guides
│   ├── development/      # Development guides
│   ├── infrastructure/   # Infrastructure guides
│   └── docs-index.md     # Complete documentation index
├── infrastructure/        # CDK infrastructure code
│   ├── bin/              # CDK app entry
│   └── lib/              # Infrastructure code
│       ├── functions/    # Lambda functions
│       ├── stacks/       # CDK stacks
│       └── types/        # Stack types
├── public/               # Static assets
│   ├── certifications/   # AWS certifications
│   ├── headshot/        # Profile images
│   └── projects/        # Project images
├── src/                  # Application source
│   ├── app/             # Next.js 14 App Router
│   │   ├── api/         # API routes
│   │   └── fonts/       # Custom fonts
│   ├── components/      # React components
│   ├── data/           # Static data
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
```

### Core Components

- **Frontend**: Next.js 14 application with App Router
- **Infrastructure**: AWS CDK for cloud resource management
- **CI/CD**: GitHub Actions for automated deployments
- **CDN**: CloudFront with Route 53 DNS
- **API**: Next.js API routes with Resend email integration

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
pnpm >= 9.0.0
AWS CLI configured
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/bjornmelin/bjornmelin-platform-io.git
cd bjornmelin-platform-io

# Install dependencies
pnpm install

# Configure AWS credentials
aws configure

# Configure environment
cp .env.example .env.local
# Edit .env.local and add your Resend API key and email addresses
```

### Infrastructure Deployment

```bash
# Deploy infrastructure
cd infrastructure
pnpm install
pnpm cdk deploy
```

### Local Development

```bash
# Start development server
pnpm dev
```

## 🛠️ Tech Stack

```yaml
Frontend:
  Core:
    - React 18
    - Next.js 14
    - TypeScript

  UI:
    - Tailwind CSS
    - shadcn/ui
    - Framer Motion
    - GeistVF Font

Infrastructure:
  Core:
    - AWS CDK
    - CloudFront
    - S3
    - Route 53
    - ACM

Development:
  Tools:
    - pnpm 9.0
    - Biome (linting & formatting)
    - TypeScript
    - PostCSS
    - Zod (schema validation)
```

## 🏗️ AWS Services Integration

### Core Services

- **CloudFront**: Global content delivery network
- **Route53**: DNS management and domain routing
- **ACM**: SSL/TLS certificate management
- **S3**: Static website hosting and assets

### Email Service

- **Resend**: Modern email API for contact form delivery

### Development & Deployment

- **CDK**: Infrastructure as code
- **GitHub Actions**: CI/CD automation
- **CloudWatch**: Basic monitoring and logging

### Security Services

- **IAM**: Role-based access control
- **WAF**: Basic security rules (optional)

## 📚 Documentation

All project documentation is organized in the `docs/` directory. For easy navigation:

- 📑 **[Complete Documentation Index](./docs/docs-index.md)** - Browse all documentation
- 🚀 **[Quick Start Guide](./docs/development/getting-started.md)** - Get up and running
- 🏗️ **[Architecture Overview](./docs/architecture/README.md)** - System design and patterns
- 🧪 **[Testing Documentation](./docs/development/testing.md)** - Comprehensive testing guide

### Optional Features

The platform includes documentation for optional enterprise features that are not deployed by default:

- 📦 **[AWS CodeArtifact Integration](./docs/infrastructure/codeartifact-backup.md)** - Enterprise-grade npm package backup solution (not deployed)

## 🔄 Git Workflow & Contributing

We follow a structured Git workflow with conventional commits. For detailed contribution guidelines:

- 📖 [Contributing Guide](./CONTRIBUTING.md) - Complete guide for contributors
- 🌳 [Branching Strategy](./docs/development/branching-strategy.md) - Git flow and branch management
- 📝 [Conventional Commits](./docs/development/conventional-commits.md) - Commit message standards

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/bjornmelin-platform-io.git
cd bjornmelin-platform-io

# Install dependencies
pnpm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add awesome feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 💻 Development Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build production application
pnpm start        # Start production server
pnpm lint         # Run Biome linter
pnpm format       # Run Biome formatter
pnpm serve        # Serve production build locally

# Testing
pnpm test         # Run unit tests with Vitest
pnpm test:ui      # Run tests with UI
pnpm test:coverage # Run tests with coverage report
pnpm test:e2e     # Run E2E tests with Playwright (requires Docker, see below)

# Infrastructure (in /infrastructure directory)
pnpm cdk deploy   # Deploy AWS infrastructure
```

## 🧪 Testing

### Unit Testing

The project uses Vitest for unit testing with comprehensive coverage:

```bash
# Run unit tests
pnpm test

# Run with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### E2E Testing

End-to-end tests are implemented using Playwright. Due to system dependencies, E2E tests must be run in Docker or CI environment.

#### Running E2E Tests Locally with Docker

```bash
# Build and run E2E tests in Docker
docker build -f Dockerfile.e2e -t e2e-tests .
docker run --rm e2e-tests

# Or use docker-compose
docker-compose -f docker-compose.e2e.yml up --build

# For development with headed browser (requires X11)
docker build -f Dockerfile.e2e.dev -t e2e-tests-dev .
docker run --rm -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix e2e-tests-dev
```

#### E2E Test Coverage

The E2E test suite includes:
- ✅ Contact form happy path submission
- ✅ Form validation and error handling (with Zod schemas)
- ✅ Rate limiting verification (5 requests/5 minutes)
- ✅ Security features (honeypot, GDPR consent)
- ✅ Accessibility compliance
- ✅ XSS prevention

#### CI/CD Integration

E2E tests automatically run on GitHub Actions for all PRs and pushes to main branch. Test reports and videos are uploaded as artifacts for debugging.

## 👨‍💻 Author

### Bjorn Melin

[![AWS Certified Solutions Architect](https://images.credly.com/size/110x110/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate)
[![AWS Certified Developer](https://images.credly.com/size/110x110/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-developer-associate)
[![AWS Certified SysOps Administrator](https://images.credly.com/size/110x110/images/f0d3fbb9-bfa7-4017-9989-7bde8eaf42b1/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-sysops-administrator-associate)
[![AWS Certified Machine Learning Engineer](https://images.credly.com/size/110x110/images/1a634b4e-3d6b-4a74-b118-c0dcb429e8d2/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-machine-learning-engineer-associate)
[![AWS Certified AI Practitioner](https://images.credly.com/size/110x110/images/4d4693bb-530e-4bca-9327-de07f3aa2348/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-ai-practitioner)
[![AWS Certified Cloud Practitioner](https://images.credly.com/size/110x110/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-cloud-practitioner)

AWS-certified Solutions Architect, Developer, SysOps Administrator, and Machine Learning Engineer with expertise in cloud architecture and modern development practices. Connect with me on:

- [GitHub](https://github.com/BjornMelin)
- [LinkedIn](https://www.linkedin.com/in/bjorn-melin/)
- [Coursera](https://www.coursera.org/learner/bjorn-melin)
- [Medium](https://medium.com/@bjornmelin)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=bjornmelin/bjornmelin-platform-io&type=Date)](https://star-history.com/#bjornmelin/bjornmelin-platform-io&Date)

## 📚 How to Reference

If you use this project in your research or work, please cite it as:

```bibtex
@misc{melin2024portfolio,
  author = {Melin, Bjorn},
  title = {bjornmelin-platform-io: Cloud-Native Portfolio Platform},
  year = {2024},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/bjornmelin/bjornmelin-platform-io}},
  commit = {main}
}
```

Standard Citation:

```
Melin, B. (2024). bjornmelin-platform-io: Cloud-Native Portfolio Platform [Computer software]. GitHub. https://github.com/bjornmelin/bjornmelin-platform-io
```

## 🙏 Acknowledgments

- AWS Documentation and Best Practices
- AWS CDK Patterns Community
- Next.js Documentation

---

<div align="center">

Built with React 18 + Next.js 14 by [Bjorn Melin](https://bjornmelin.io)

</div>
