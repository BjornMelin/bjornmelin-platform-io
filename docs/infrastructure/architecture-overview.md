# bjornmelin.io Infrastructure Architecture Overview

## Executive Summary

This document provides a comprehensive overview of the AWS infrastructure architecture for the bjornmelin.io portfolio website. The architecture follows AWS Well-Architected Framework principles with a focus on security, reliability, performance efficiency, cost optimization, and operational excellence.

## High-Level Architecture

```mermaid
graph TB
    %% Users and External Access
    Users[👥 Internet Users]
    
    %% DNS Layer
    Route53[🌐 Route 53<br/>bjornmelin.io<br/>DNS Management]
    
    %% CDN and Web Hosting
    CloudFront[🌍 CloudFront<br/>Global CDN<br/>SSL/TLS Termination]
    S3[🪣 S3 Bucket<br/>Static Website<br/>Content Storage]
    
    %% API Infrastructure
    APIGateway[🚪 API Gateway<br/>api.bjornmelin.io<br/>RESTful API]
    Lambda[⚡ Lambda Function<br/>Contact Form Handler<br/>Node.js 20.x ARM64]
    
    %% Configuration and Security
    ParameterStore[🔒 Parameter Store<br/>Secure Configuration<br/>API Keys]
    KMS[🔑 KMS Customer Key<br/>Encryption<br/>Auto-rotation]
    
    %% External Email Service
    Resend[📧 Resend API<br/>External SaaS<br/>Email Delivery]
    
    %% Monitoring and Logging
    CloudWatch[📊 CloudWatch<br/>Metrics & Logs<br/>Performance Monitoring]
    SNS[📢 SNS Topics<br/>Alerting<br/>Notifications]
    CloudTrail[📋 CloudTrail<br/>Audit Logging<br/>Compliance]
    
    %% User Flow
    Users --> Route53
    Route53 --> CloudFront
    CloudFront --> S3
    
    %% API Flow
    Users -.->|Contact Form API| Route53
    Route53 -.-> APIGateway
    APIGateway --> Lambda
    Lambda --> ParameterStore
    ParameterStore --> KMS
    Lambda --> Resend
    
    %% Monitoring Flow
    Lambda --> CloudWatch
    APIGateway --> CloudWatch
    CloudWatch --> SNS
    CloudWatch --> CloudTrail
    
    %% Styling
    classDef userClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef awsCompute fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef awsStorage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef awsSecurity fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef external fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef monitoring fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    
    class Users userClass
    class Lambda,APIGateway awsCompute
    class S3,ParameterStore awsStorage
    class KMS,CloudTrail awsSecurity
    class Resend external
    class CloudWatch,SNS monitoring
    class Route53,CloudFront awsCompute
```

## Architecture Components

### 1. Frontend Infrastructure
- **Route 53 Hosted Zone**: DNS management for bjornmelin.io domain
- **CloudFront Distribution**: Global CDN for static content delivery
- **S3 Bucket**: Static website hosting with versioning enabled
- **SSL/TLS Certificate**: ACM certificate for HTTPS encryption

### 2. API Infrastructure
- **API Gateway**: RESTful API endpoint for contact form submissions
- **Lambda Function**: Serverless compute for processing contact form data
- **Parameter Store**: Secure storage for Resend API configuration
- **KMS Customer Managed Key**: Encryption for sensitive parameters

### 3. Email Service Integration
- **Resend API**: External email service for transactional emails
- **DNS Records**: SPF, DKIM, and domain verification records
- **Email Authentication**: Comprehensive email security configuration

### 4. Security & Compliance
- **IAM Roles & Policies**: Least privilege access control
- **CloudTrail**: Comprehensive audit logging
- **KMS Encryption**: Customer-managed keys for data protection
- **Security Headers**: HTTPS enforcement and security headers

### 5. Monitoring & Observability
- **CloudWatch**: Metrics, logs, and dashboards
- **SNS**: Alerting and notifications
- **Custom Metrics**: Application-specific monitoring

## Core Design Principles

### Security First
- All data encrypted in transit and at rest
- Customer-managed KMS keys for sensitive data
- Least privilege IAM policies
- Comprehensive audit logging with CloudTrail
- Regular security reviews and rotation schedules

### Cost Optimization
- Serverless architecture reduces operational costs
- Parameter Store vs. Secrets Manager (saves $0.40/month)
- Optimized log retention policies
- Free tier utilization where appropriate
- ARM64 Lambda architecture for cost efficiency

### Reliability & Performance
- Multi-AZ deployment for high availability
- CloudFront edge locations for global performance
- Automated retry logic and error handling
- Parameter caching to reduce API calls
- Monitoring and alerting for proactive issue resolution

### Operational Excellence
- Infrastructure as Code using AWS CDK
- Automated deployment pipelines
- Comprehensive monitoring and dashboards
- Documentation and runbooks
- Automated rotation capabilities

## Regional Deployment Strategy

### Primary Region: us-east-1
- **Why**: Required for CloudFront certificate validation
- **Components**: All core infrastructure deployed here
- **Compliance**: Meets data residency requirements

### Global Services
- **CloudFront**: Global edge locations for performance
- **Route 53**: Global DNS with health checks
- **Certificate Manager**: Global certificate distribution

## Network Architecture

```mermaid
flowchart TD
    %% External Access
    Internet[🌐 Internet Users]
    
    %% DNS Layer
    Route53[🌐 Route 53 DNS<br/>bjornmelin.io<br/>Global DNS Resolution]
    
    %% Content Delivery
    subgraph CDN ["Content Delivery Network"]
        CloudFront[🌍 CloudFront<br/>Global Edge Locations<br/>SSL/TLS Termination<br/>DDoS Protection]
    end
    
    %% Static Hosting
    subgraph StaticHosting ["Static Website Hosting"]
        S3[🪣 S3 Bucket<br/>Static Content<br/>Website Files<br/>Versioning Enabled]
    end
    
    %% API Infrastructure  
    subgraph APIInfra ["API Infrastructure"]
        APIGateway[🚪 API Gateway<br/>api.bjornmelin.io<br/>RESTful Endpoints<br/>Rate Limiting]
        Lambda[⚡ Lambda Function<br/>Contact Form Handler<br/>ARM64 Architecture<br/>256MB Memory]
    end
    
    %% Security & Configuration
    subgraph Security ["Security & Config"]
        ParameterStore[🔒 Parameter Store<br/>Secure Configuration<br/>Standard Tier<br/>KMS Encrypted]
        KMS[🔑 KMS Customer Key<br/>Encryption Management<br/>Auto-rotation<br/>Audit Logging]
    end
    
    %% External Services
    subgraph External ["External Services"]
        Resend[📧 Resend API<br/>Email Service<br/>3k emails/month<br/>DKIM + SPF]
    end
    
    %% Monitoring
    subgraph Monitoring ["Monitoring & Logging"]
        CloudWatch[📊 CloudWatch<br/>Metrics & Logs<br/>Performance Data<br/>Custom Metrics]
        SNS[📢 SNS Topics<br/>Alert Notifications<br/>Real-time Alerts]
        CloudTrail[📋 CloudTrail<br/>API Audit Logs<br/>Compliance Tracking<br/>Security Events]
    end
    
    %% Network Flows
    Internet --> Route53
    Route53 -->|Static Content| CloudFront
    CloudFront --> S3
    
    Route53 -.->|API Requests| APIGateway
    APIGateway --> Lambda
    Lambda --> ParameterStore
    ParameterStore <--> KMS
    Lambda --> Resend
    
    %% Monitoring Flows
    Lambda --> CloudWatch
    APIGateway --> CloudWatch
    S3 --> CloudWatch
    CloudWatch --> SNS
    CloudWatch --> CloudTrail
    
    %% Styling
    classDef internet fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef aws fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef security fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef external fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef monitoring fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class Internet internet
    class Route53,CloudFront,S3,APIGateway,Lambda aws
    class ParameterStore,KMS,CloudTrail security
    class Resend external
    class CloudWatch,SNS monitoring
```

## Data Flow Analysis

### Contact Form Submission Flow

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant CDN as 🌍 CloudFront
    participant API as 🚪 API Gateway
    participant Lambda as ⚡ Lambda Function
    participant PS as 🔒 Parameter Store
    participant KMS as 🔑 KMS Key
    participant Resend as 📧 Resend API
    participant CW as 📊 CloudWatch
    participant SNS as 📢 SNS
    
    Note over User, SNS: Contact Form Submission Process
    
    %% 1. Form Submission
    User->>CDN: Submit Contact Form (POST)
    Note right of User: CSRF token included<br/>Client-side validation passed
    
    CDN->>API: Forward to api.bjornmelin.io
    API->>Lambda: Invoke contact-form-handler
    
    %% 2. Security Validation
    Lambda->>Lambda: Validate CSRF Token
    Lambda->>Lambda: Sanitize Input Data
    Lambda->>Lambda: Check Rate Limits
    Lambda->>Lambda: Spam Detection
    
    %% 3. Configuration Retrieval
    Lambda->>PS: GetParameter (resend-config)
    PS->>KMS: Decrypt SecureString
    KMS-->>PS: Decrypted Configuration
    PS-->>Lambda: API Configuration
    
    %% 4. Email Processing
    Lambda->>Resend: Send Email Request
    Note right of Resend: Template rendering<br/>DKIM signing<br/>Delivery processing
    Resend-->>Lambda: Email ID Response
    
    %% 5. Response & Monitoring
    Lambda->>CW: Record Success Metrics
    Lambda->>CW: Log Request Details
    Lambda-->>API: Success Response
    API-->>CDN: JSON Response
    CDN-->>User: Thank You Message
    
    %% 6. Alerting (if needed)
    alt Email Send Failure
        Lambda->>CW: Record Error Metrics
        CW->>SNS: Trigger Alert
        SNS->>SNS: Notify Operations Team
    end
    
    %% 7. Audit Logging
    Note over Lambda, CW: All actions logged to CloudWatch<br/>API calls tracked by CloudTrail
```

## Security Architecture

### Defense in Depth

```mermaid
graph TD
    %% Security Layers
    subgraph Layer1 ["🌐 Layer 1: Network Security"]
        HTTPS[🔒 HTTPS Enforcement<br/>TLS 1.2+ Required]
        Headers[🛡️ Security Headers<br/>CSP, HSTS, X-Frame-Options]
        DDoS[🛡️ DDoS Protection<br/>CloudFront Shield]
        WAF[🔥 WAF Rules<br/>Future Enhancement]
    end
    
    subgraph Layer2 ["🚪 Layer 2: API Security"]
        CSRF[🎫 CSRF Protection<br/>Rolling Tokens]
        RateLimit[⏱️ Rate Limiting<br/>Per IP/Session]
        Validation[✅ Input Validation<br/>Sanitization & XSS Prevention]
        Auth[🔐 Authentication<br/>Future API Keys]
    end
    
    subgraph Layer3 ["💾 Layer 3: Data Security"]
        KMSEnc[🔑 KMS Encryption<br/>Customer Managed Keys]
        ParamStore[🔒 Parameter Store<br/>SecureString Encryption]
        Transit[🔐 TLS in Transit<br/>End-to-end Encryption]
        KeyRotation[🔄 Key Rotation<br/>Automatic + Manual]
    end
    
    subgraph Layer4 ["👤 Layer 4: Access Control"]
        IAM[👥 IAM Policies<br/>Least Privilege]
        ResourcePolicy[📋 Resource Policies<br/>Service-specific Controls]
        ServiceAuth[🤝 Service Authentication<br/>Role-based Access]
        AccessReview[🔍 Access Reviews<br/>Regular Audits]
    end
    
    subgraph Layer5 ["📊 Layer 5: Monitoring & Auditing"]
        CloudTrail[📋 CloudTrail<br/>API Audit Logging]
        Monitoring[📈 CloudWatch<br/>Real-time Monitoring]
        Anomaly[🚨 Anomaly Detection<br/>ML-based Alerts]
        Alerting[📢 Security Alerting<br/>SNS Notifications]
    end
    
    %% Data Flow Through Layers
    Internet[🌐 Internet Request] --> Layer1
    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer4 --> Layer5
    
    %% Feedback Loop
    Layer5 -.->|Security Events| Layer1
    Layer5 -.->|Rate Limit Updates| Layer2
    Layer5 -.->|Access Violations| Layer4
    
    %% Styling
    classDef network fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef api fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef access fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef monitoring fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class HTTPS,Headers,DDoS,WAF network
    class CSRF,RateLimit,Validation,Auth api
    class KMSEnc,ParamStore,Transit,KeyRotation data
    class IAM,ResourcePolicy,ServiceAuth,AccessReview access
    class CloudTrail,Monitoring,Anomaly,Alerting monitoring
```

### Encryption Strategy

- **Data at Rest**: Customer-managed KMS keys
- **Data in Transit**: TLS 1.2+ enforcement
- **Parameter Store**: SecureString with KMS encryption
- **Key Rotation**: Automatic KMS key rotation enabled
- **API Keys**: Quarterly manual rotation schedule

## Performance Optimization

### CDN Strategy
- **CloudFront Distribution**: Global edge locations
- **Cache Behaviors**: Optimized for static content
- **Compression**: Gzip/Brotli compression enabled
- **Origin Access Control**: Secure S3 access

### API Performance
- **Lambda**: ARM64 architecture for cost/performance
- **Parameter Caching**: 1-hour cache for configuration
- **Connection Reuse**: HTTP connection pooling
- **Error Handling**: Exponential backoff for retries

### Monitoring Metrics
- **Response Times**: 95th percentile tracking
- **Error Rates**: Real-time error monitoring
- **Throughput**: Requests per minute/hour
- **Cost Tracking**: Resource utilization metrics

## Disaster Recovery & Business Continuity

### Backup Strategy
- **S3 Versioning**: Automatic version management
- **Parameter History**: 100 versions retained
- **CloudFormation**: Infrastructure as Code backup
- **Configuration**: Git-based version control

### Recovery Procedures
- **RTO (Recovery Time Objective)**: < 30 minutes
- **RPO (Recovery Point Objective)**: < 5 minutes
- **Automated Rollback**: CDK stack rollback capabilities
- **Manual Procedures**: Documented emergency procedures

### Testing Schedule
- **Monthly**: Backup verification
- **Quarterly**: Full recovery testing
- **Annually**: Disaster recovery simulation
- **Continuous**: Automated monitoring validation

## Cost Analysis & Optimization

### Monthly Cost Breakdown
```
Service                    | Estimated Cost | Notes
---------------------------|----------------|------------------------
Route 53 Hosted Zone      | $0.50         | Standard DNS hosting
CloudFront Distribution   | $0.10         | Low traffic volume
S3 Static Website        | $0.05         | Minimal storage/requests
API Gateway              | $0.00         | Free tier coverage
Lambda Function          | $0.00         | Free tier coverage
Parameter Store          | $0.00         | Standard parameters free
KMS Customer Key         | $1.00         | Monthly key charge
KMS API Calls           | $0.03         | Minimal API usage
CloudWatch Logs         | $0.30         | Optimized retention
SNS Notifications      | $0.00         | Low volume
Resend API              | $0.00         | Free tier (3k emails/month)
---------------------------|----------------|------------------------
Total Monthly Cost      | ~$1.98        | Plus any overage charges
```

### Cost Optimization Strategies
1. **Free Tier Utilization**: Maximize AWS free tier benefits
2. **Resource Right-sizing**: Optimal Lambda memory allocation
3. **Log Retention**: 7-day retention for non-critical logs
4. **Parameter Store**: Standard tier vs. advanced tier
5. **Monitoring**: Essential metrics only to reduce costs

## Compliance & Governance

### Data Protection
- **GDPR Compliance**: Data processing transparency
- **Data Retention**: Configurable retention policies
- **Data Portability**: Export capabilities for user data
- **Right to Deletion**: Automated data removal procedures

### Audit Requirements
- **CloudTrail Logging**: All API calls logged
- **Access Logging**: Comprehensive access tracking
- **Change Management**: All changes via Infrastructure as Code
- **Security Reviews**: Quarterly security assessments

### Documentation Standards
- **Architecture Documentation**: This document and diagrams
- **Operational Runbooks**: Step-by-step procedures
- **Security Policies**: Clear security guidelines
- **Incident Response**: Emergency response procedures

## Future Roadmap

### Phase 1 (Current): Core Infrastructure
- ✅ Static website hosting
- ✅ Contact form functionality
- ✅ Security implementation
- ✅ Monitoring setup

### Phase 2 (Q1 2024): Enhanced Features
- 🔄 Enhanced email templates
- 🔄 Form analytics and tracking
- 🔄 Additional security hardening
- 🔄 Performance optimization

### Phase 3 (Q2 2024): Advanced Capabilities
- ⏳ Multi-language support
- ⏳ Advanced monitoring dashboards
- ⏳ Automated security scanning
- ⏳ Enhanced backup strategies

### Phase 4 (Q3 2024): Scale & Optimization
- ⏳ Global deployment optimization
- ⏳ Advanced caching strategies
- ⏳ Cost optimization review
- ⏳ Security posture enhancement

## Contact & Support

For questions about this architecture or infrastructure changes, please contact:
- **Primary Contact**: Bjorn Melin (bjornmelin16@gmail.com)
- **Documentation**: Located in `/docs/infrastructure/`
- **Emergency Procedures**: See disaster recovery documentation
- **Change Requests**: Use GitHub issues for infrastructure changes

## Related Documentation

This architecture overview is part of a comprehensive documentation suite:

### Architecture Documentation Suite
- **[Email Service Architecture](./email-service-architecture.md)** - Detailed email service flow and technical specifications
- **[Security Architecture](./security-architecture.md)** - Defense-in-depth security layers and compliance
- **[API Gateway + Lambda Architecture](./api-lambda-architecture.md)** - Serverless API architecture and performance
- **[DNS Configuration Guide](./dns-configuration-guide.md)** - Complete DNS setup and email authentication

### Implementation Guides
- **[Email Infrastructure Guide](./email-infrastructure-guide.md)** - Complete email service implementation with AWS
- **[Application Integration Examples](./application-integration-examples.md)** - Code examples for Lambda and frontend integration
- **[Resend Complete Setup Guide](../deployment/resend-complete-setup-guide.md)** - Comprehensive setup guide for email service

### Operational Documentation
- **[Security Audit Checklist](./security-audit-checklist.md)** - Security review and compliance checklist
- **[AWS Free Tier Optimization Guide](./aws-free-tier-optimization-2025.md)** - Cost optimization strategies
- **[Parameter Store Migration Guide](./parameter-store-migration-guide.md)** - Migration from Secrets Manager

---

*This document is part of the bjornmelin.io infrastructure documentation suite. Last updated: 2024-12-23*