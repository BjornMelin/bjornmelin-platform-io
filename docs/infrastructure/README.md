# Infrastructure Documentation

This directory contains all infrastructure-related documentation for the bjornmelin.io platform.

## Quick Links

- [Email Service Documentation](./email-service.md) - Comprehensive email service guide (Resend API)
- [AWS Free Tier Optimization Guide](./aws-free-tier-optimization-2025.md) - Cost optimization strategies and free tier analysis
- [Parameter Store Migration Guide](./parameter-store-migration-guide.md) - Step-by-step migration from Secrets Manager
- [Email Infrastructure Guide](./email-infrastructure-guide.md) - Complete email service implementation with AWS
- [Security Audit Checklist](./security-audit-checklist.md) - Security review and compliance checklist
- [Application Integration Examples](./application-integration-examples.md) - Code examples for Lambda and frontend integration

## Overview

The bjornmelin.io infrastructure is built on AWS using Infrastructure as Code (IaC) with AWS CDK v2. This documentation covers all aspects of the infrastructure including architecture, security, cost optimization, and implementation guides.

## Infrastructure Components

### Core Services
- **AWS Route 53**: DNS management and domain hosting
- **AWS CloudFront**: CDN for static content delivery
- **AWS S3**: Static website hosting and file storage
- **AWS Lambda**: Serverless compute for API endpoints
- **AWS API Gateway**: RESTful API management

### Security & Secrets
- **AWS KMS**: Encryption key management
- **AWS Systems Manager Parameter Store**: Secure configuration storage (recommended)
- **AWS Secrets Manager**: Secret rotation (for critical secrets only)
- **AWS IAM**: Identity and access management

### Monitoring & Operations
- **AWS CloudWatch**: Logs, metrics, and dashboards
- **AWS CloudTrail**: Audit logging
- **AWS SNS**: Alert notifications

## Cost Optimization

Our infrastructure is optimized to maximize AWS Free Tier usage:

- **Monthly Cost**: ~$1.80 (after optimization)
- **Annual Cost**: ~$21.60
- **Free Tier Services**: Lambda, API Gateway, CloudWatch basics, KMS requests
- **Paid Services**: Route 53 ($0.50/month), KMS key ($1.00/month)

See [AWS Free Tier Optimization Guide](./aws-free-tier-optimization-2025.md) for detailed analysis and recommendations.

## Security Best Practices

- ✅ Encryption at rest and in transit
- ✅ Least privilege IAM policies
- ✅ Audit logging with CloudTrail
- ✅ Automated security scanning
- ✅ Regular security audits

See [Security Audit Checklist](./security-audit-checklist.md) for comprehensive security review procedures.

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 20.x and pnpm installed
- AWS CDK CLI installed (`pnpm install -g aws-cdk`)

### Deployment
```bash
cd infrastructure
pnpm install
pnpm run build
pnpm run deploy:all
```

### Configuration
1. Set up AWS credentials
2. Configure domain in Route 53
3. Deploy infrastructure stacks
4. Add secrets to Parameter Store
5. Verify email service configuration

## Documentation Structure

```
docs/infrastructure/
├── README.md                               # This file
├── email-service.md                       # Email service documentation (Resend)
├── aws-free-tier-optimization-2025.md     # Cost optimization analysis
├── parameter-store-migration-guide.md     # Migration from Secrets Manager
├── email-infrastructure-guide.md          # Email service implementation (AWS)
├── security-audit-checklist.md           # Security review checklist
└── application-integration-examples.md    # Integration code examples
```

## Related Documentation

- [Architecture Overview](../architecture/README.md)
- [AWS Services Documentation](../architecture/aws-services.md)
- [Infrastructure as Code](../architecture/infrastructure.md)
- [Deployment Guide](../deployment/README.md)
- [CI/CD Pipeline](../deployment/ci-cd.md)

## Maintenance

### Regular Tasks
- **Daily**: Monitor CloudWatch dashboards
- **Weekly**: Review security alerts
- **Monthly**: Cost analysis and optimization
- **Quarterly**: Security audit and secret rotation

### Cost Monitoring
1. Enable AWS Free Tier alerts (85% threshold)
2. Set up zero-spend budgets
3. Review monthly billing reports
4. Track service usage against free tier limits

## Support

For infrastructure-related questions or issues:
1. Check the relevant documentation in this directory
2. Review AWS service documentation
3. Check CloudWatch logs for errors
4. Contact the infrastructure team

## Contributing

When updating infrastructure:
1. Update relevant documentation
2. Test changes in development first
3. Follow the security checklist
4. Update cost analysis if needed
5. Commit documentation with code changes