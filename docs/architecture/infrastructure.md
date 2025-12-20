# Infrastructure Architecture

The infrastructure is managed using AWS CDK (Cloud Development Kit) with
TypeScript.

## Stack Organization

```text
infrastructure/
├── bin/
│   └── app.ts               # CDK app entry point
├── lib/
│   ├── constants.ts         # Shared constants
│   ├── functions/          # Lambda functions
│   │   └── contact-form/   # Contact form handler
│   ├── stacks/            # CDK stack definitions
│   │   ├── deployment-stack.ts
│   │   ├── dns-stack.ts
│   │   ├── email-stack.ts
│   │   ├── monitoring-stack.ts
│   │   └── storage-stack.ts
│   └── types/             # TypeScript types
└── cdk.json              # CDK configuration
```

## Stack Descriptions

### DNS Stack

- Manages Route 53 DNS configuration
- Handles domain name management
- Configures DNS records

### Email Stack

- Configures email delivery via Resend API
- Sets up Lambda function for contact form
- Manages API Gateway and CORS configuration

### Monitoring Stack

- Implements CloudWatch monitoring
- Configures alarms and metrics
- Sets up logging infrastructure

### Storage Stack

- Manages S3 buckets
- Configures storage policies
- Handles asset storage

### Deployment Stack

- Manages deployment configuration
- Handles infrastructure deployment
- Configures deployment environments

## Infrastructure as Code

All infrastructure is defined as code using AWS CDK TypeScript:

```typescript
// Example stack structure
export class EmailStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda function for contact form
    // API Gateway configuration
    // SSM parameter access for Resend API key
  }
}
```

## Deployment Process

1. Infrastructure changes are committed to version control
2. CI/CD pipeline validates changes
3. CDK diff shows infrastructure changes
4. Changes are deployed to environments

```bash
# Deploy all stacks
cdk deploy --all

# Deploy specific stack
cdk deploy EmailStack
```

## Environment Management

- Development environment for testing
- Production environment for live service
- Environment-specific configurations
- Separate AWS accounts per environment

## Security Considerations

### IAM Roles and Policies

- Principle of least privilege
- Service-specific roles
- Resource access controls

### Network Security

- VPC configuration
- Security groups
- Network ACLs

### Resource Protection

- Backup policies
- Deletion protection
- Access logging

## Monitoring and Alerts

- CloudWatch metrics
- Custom alarms
- Log aggregation
- Performance monitoring

## Cost Management

- Resource tagging
- Cost allocation
- Usage monitoring
- Optimization strategies

## Best Practices

1. Use typed constructs
2. Follow AWS Well-Architected Framework
3. Implement proper tagging
4. Maintain documentation
5. Regular security reviews
6. Cost optimization reviews

## Disaster Recovery

- Backup strategies
- Recovery procedures
- Business continuity plans
- Regular testing

## Infrastructure Updates

When making infrastructure changes:

1. Create feature branch
2. Make infrastructure code changes
3. Run `cdk diff` to review changes
4. Create pull request
5. Review and approve changes
6. Deploy to development
7. Test thoroughly
8. Deploy to production
