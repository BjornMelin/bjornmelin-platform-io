# 🏗️ bjornmelin-platform-io

Cloud-native portfolio platform powering bjornmelin.io. Demonstrates AWS
solutions architecture through serverless APIs and infrastructure as code.
Built with React 18, Next.js 14, AWS CDK, and modern DevOps practices. Requires Node.js 24.x LTS.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![AWS SAA](https://img.shields.io/badge/AWS-Solutions%20Architect%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate)
[![AWS DVA](https://img.shields.io/badge/AWS-Developer%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-developer-associate)
[![AWS SysOps](https://img.shields.io/badge/AWS-SysOps%20Administrator%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-sysops-administrator-associate)
[![AWS ML](https://img.shields.io/badge/AWS-Machine%20Learning%20Engineer%20Associate-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-machine-learning-engineer-associate)
[![AWS AIF](https://img.shields.io/badge/AWS-AI%20Practitioner-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-ai-practitioner)
[![AWS CCP](https://img.shields.io/badge/AWS-Cloud%20Practitioner-FF9900?logo=amazon-aws)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-cloud-practitioner)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black?logo=next.js)](https://nextjs.org/)
[![GitHub](https://img.shields.io/badge/GitHub-BjornMelin-181717?logo=github)](https://github.com/BjornMelin)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bjorn%20Melin-0077B5?logo=linkedin)](https://www.linkedin.com/in/bjorn-melin/)
[![Coursera](https://img.shields.io/badge/Coursera-2A73CC?logo=coursera&logoColor=white)](https://www.coursera.org/learner/bjorn-melin)
[![Medium](https://img.shields.io/badge/Medium-000000?logo=medium&logoColor=white)](https://medium.com/@bjornmelin)

## 🌟 Features

### Core Platform Features

- 🏗️ **Cloud Native Architecture**: Production-grade AWS infrastructure with CDK
- 🔐 **Enterprise Security**: Zero-trust architecture with AWS Cognito
- 🚀 **CI/CD Pipeline**: GitHub Actions assumes short-lived AWS roles via OIDC
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

- [🏗️ bjornmelin-platform-io](#️-bjornmelin-platform-io)
  - [🌟 Features](#-features)
    - [Core Platform Features](#core-platform-features)
    - [Modern Tech Features](#modern-tech-features)
  - [📚 Quick Links](#-quick-links)
  - [🏛️ Architecture](#️-architecture)
    - [System Architecture](#system-architecture)
    - [Contact Form Flow](#contact-form-flow)
    - [DNS \& CDN Setup](#dns--cdn-setup)
  - [📁 Project Structure](#-project-structure)
    - [Core Components](#core-components)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Initial Setup](#initial-setup)
    - [Infrastructure Deployment](#infrastructure-deployment)
    - [Local Development](#local-development)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [🏗️ AWS Services Integration](#️-aws-services-integration)
    - [Core Services](#core-services)
    - [Compute \& Messaging Services](#compute--messaging-services)
    - [Development \& Deployment](#development--deployment)
    - [Security Services](#security-services)
  - [💻 Development Scripts](#-development-scripts)
  - [🐳 Run with Docker](#-run-with-docker)
  - [👨‍💻 Author](#-author)
    - [Bjorn Melin](#bjorn-melin)
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
        LAMBDA[Contact Form Lambda]
        SES[Amazon SES]
    end

    subgraph "DNS & SSL"
        R53[Route 53]
        ACM[ACM Certificate]
    end

    CF --> LAMBDA
    LAMBDA --> SES
    R53 --> CF
    ACM --> CF
```

### Contact Form Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Lambda
    participant SES

    User->>Frontend: Submit Contact Form
    Frontend->>Lambda: POST /api/contact
    Lambda->>SES: Send Email
    SES-->>Lambda: Email Sent
    Lambda-->>Frontend: Success Response
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
│   └── security/         # Security docs
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
- **API**: Serverless Lambda functions with SES integration

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
yarn >= 4.0.0
AWS CLI configured
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/bjornmelin/bjornmelin-platform-io.git
cd bjornmelin-platform-io

# Install dependencies
yarn install

# Configure AWS credentials
aws configure

# Configure environment
cp .env.production .env.local
```

### Infrastructure Deployment

```bash
# Deploy infrastructure
cd infrastructure
yarn install
yarn cdk deploy
```

### Local Development

```bash
# Start development server
yarn dev
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
    - Lambda
    - SES

Development:
  Tools:
    - yarn 4.0
    - ESLint
    - Prettier
    - TypeScript
    - PostCSS
```

## 🏗️ AWS Services Integration

### Core Services

- **CloudFront**: Global content delivery network
- **Route53**: DNS management and domain routing
- **ACM**: SSL/TLS certificate management
- **S3**: Static website hosting and assets

### Compute & Messaging Services

- **Lambda**: Serverless contact form handling
- **SES**: Email delivery for contact form

### Development & Deployment

- **CDK**: Infrastructure as code
- **GitHub Actions**: CI/CD automation
- **CloudWatch**: Basic monitoring and logging

### Security Services

- **IAM**: Role-based access control
- **WAF**: Basic security rules (optional)

## 💻 Development Scripts

```bash
# Development
yarn dev          # Start development server
yarn build        # Build production application
yarn start        # Start production server
yarn lint         # Run ESLint
yarn serve        # Serve production build locally

# Infrastructure (in /infrastructure directory)
yarn cdk deploy   # Deploy AWS infrastructure
```

## 🐳 Run with Docker

Build the production image (requires Docker Desktop/daemon running):

```bash
docker build -t platform-io:node24 .
```

Run the container and serve the exported site on port 8080:

```bash
docker run --rm -p 8080:80 platform-io:node24
```

Open <http://localhost:8080> in your browser. Use Ctrl+C to stop the container.

## 👨‍💻 Author

### Bjorn Melin

[![AWS Certified Solutions Architect](https://images.credly.com/size/110x110/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate)
[![AWS Certified Developer](https://images.credly.com/size/110x110/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-developer-associate)
[![AWS Certified SysOps Administrator](https://images.credly.com/size/110x110/images/f0d3fbb9-bfa7-4017-9989-7bde8eaf42b1/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-sysops-administrator-associate)
[![AWS Certified Machine Learning Engineer](https://images.credly.com/size/110x110/images/1a634b4e-3d6b-4a74-b118-c0dcb429e8d2/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-machine-learning-engineer-associate)
[![AWS Certified AI Practitioner](https://images.credly.com/size/110x110/images/4d4693bb-530e-4bca-9327-de07f3aa2348/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-ai-practitioner)
[![AWS Certified Cloud Practitioner](https://images.credly.com/size/110x110/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png)](https://www.credly.com/org/amazon-web-services/badge/aws-certified-cloud-practitioner)

AWS-certified Solutions Architect, Developer, SysOps Administrator, and Machine
Learning Engineer with expertise in cloud architecture and modern development
practices. Connect with me on:

- [GitHub](https://github.com/BjornMelin)
- [LinkedIn](https://www.linkedin.com/in/bjorn-melin/)
- [Coursera](https://www.coursera.org/learner/bjorn-melin)
- [Medium](https://medium.com/@bjornmelin)

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file
for details.

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

```text
Melin, B. (2024). bjornmelin-platform-io: Cloud-Native Portfolio Platform
[Computer software]. GitHub.
https://github.com/bjornmelin/bjornmelin-platform-io
```

## 🙏 Acknowledgments

- AWS Documentation and Best Practices
- AWS CDK Patterns Community
- Next.js Documentation

---

Built with React 18 + Next.js 14 by
[Bjorn Melin](https://bjornmelin.io).
