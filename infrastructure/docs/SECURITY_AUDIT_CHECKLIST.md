# Email Infrastructure Security Audit Checklist

## Pre-Deployment Security Review

### Secrets Management
- [ ] **KMS Key Configuration**
  - [ ] Customer-managed key created
  - [ ] Key rotation enabled
  - [ ] Key deletion protection (30-day retention)
  - [ ] Key policy restricts access to specific IAM roles
  - [ ] CloudTrail can use key for log encryption

- [ ] **Secrets Manager Configuration**
  - [ ] Secret encrypted with customer KMS key
  - [ ] Version control enabled
  - [ ] Automatic rotation configured (90 days)
  - [ ] Resource policy restricts access
  - [ ] No default/placeholder values in production

- [ ] **IAM Policies**
  - [ ] Least privilege principle applied
  - [ ] Condition keys used (e.g., `secretsmanager:VersionStage`)
  - [ ] Service-specific access (e.g., `kms:ViaService`)
  - [ ] No wildcard permissions
  - [ ] Separate policies for read/write access

### Network Security
- [ ] **API Access**
  - [ ] HTTPS only for all API calls
  - [ ] TLS 1.2 or higher enforced
  - [ ] No secrets in URL parameters
  - [ ] API endpoints use authentication

- [ ] **Lambda Security**
  - [ ] Functions run with minimal IAM permissions
  - [ ] Environment variables encrypted
  - [ ] No secrets in function code
  - [ ] VPC configuration if required

### DNS Security
- [ ] **SPF Record**
  - [ ] Restrictive SPF policy (`~all` or `-all`)
  - [ ] Only authorized senders included
  - [ ] No deprecated mechanisms (e.g., `ptr`)

- [ ] **DKIM Configuration**
  - [ ] 2048-bit keys minimum
  - [ ] Multiple DKIM selectors for redundancy
  - [ ] Regular key rotation plan

- [ ] **DMARC Policy** (Future consideration)
  - [ ] Start with `p=none` for monitoring
  - [ ] Gradually increase to `p=quarantine` or `p=reject`
  - [ ] Configure reporting addresses

## Operational Security

### Monitoring & Alerting
- [ ] **CloudWatch Alarms**
  - [ ] Unusual secret access patterns
  - [ ] Failed rotation attempts
  - [ ] KMS key usage anomalies
  - [ ] Failed email deliveries

- [ ] **Audit Logging**
  - [ ] CloudTrail enabled for all regions
  - [ ] Log file validation enabled
  - [ ] Logs stored in secure S3 bucket
  - [ ] Log retention policy defined

- [ ] **Metrics & Dashboards**
  - [ ] Secret access frequency tracked
  - [ ] Rotation success/failure rates
  - [ ] Email delivery metrics
  - [ ] Cost tracking enabled

### Access Control
- [ ] **Human Access**
  - [ ] MFA required for AWS console access
  - [ ] Separate dev/prod access controls
  - [ ] Regular access reviews
  - [ ] No shared credentials

- [ ] **Service Access**
  - [ ] Service-to-service authentication
  - [ ] Temporary credentials only
  - [ ] No long-lived access keys
  - [ ] Regular credential rotation

### Data Protection
- [ ] **Encryption**
  - [ ] At-rest encryption for all data
  - [ ] In-transit encryption for all communications
  - [ ] Strong encryption algorithms (AES-256)
  - [ ] Secure key management

- [ ] **Data Handling**
  - [ ] PII handling procedures defined
  - [ ] Data retention policies implemented
  - [ ] Secure data disposal methods
  - [ ] GDPR compliance if applicable

## Incident Response

### Preparation
- [ ] **Response Plan**
  - [ ] Incident response procedures documented
  - [ ] Contact information up-to-date
  - [ ] Escalation paths defined
  - [ ] Regular drills conducted

- [ ] **Detection Capabilities**
  - [ ] Real-time alerting configured
  - [ ] Log analysis tools available
  - [ ] Anomaly detection enabled
  - [ ] Regular security reviews

### Recovery Procedures
- [ ] **Secret Compromise**
  - [ ] Immediate rotation procedure
  - [ ] Affected systems inventory
  - [ ] Communication plan
  - [ ] Post-incident review process

- [ ] **Service Disruption**
  - [ ] Rollback procedures tested
  - [ ] Backup authentication methods
  - [ ] Service degradation plan
  - [ ] Customer communication templates

## Compliance & Governance

### Documentation
- [ ] **Security Documentation**
  - [ ] Architecture diagrams current
  - [ ] Security controls documented
  - [ ] Risk assessments completed
  - [ ] Compliance mappings maintained

- [ ] **Operational Procedures**
  - [ ] Rotation procedures documented
  - [ ] Emergency access procedures
  - [ ] Change management process
  - [ ] Security training materials

### Regular Reviews
- [ ] **Quarterly Reviews**
  - [ ] Access permissions audit
  - [ ] Security group rules review
  - [ ] Cost optimization review
  - [ ] Compliance status check

- [ ] **Annual Reviews**
  - [ ] Full security assessment
  - [ ] Penetration testing
  - [ ] Disaster recovery testing
  - [ ] Policy updates

## Post-Deployment Validation

### Functional Testing
- [ ] **Secret Rotation**
  - [ ] Manual rotation successful
  - [ ] Automatic rotation tested
  - [ ] No service disruption during rotation
  - [ ] Old keys properly revoked

- [ ] **Email Delivery**
  - [ ] SPF validation passing
  - [ ] DKIM signatures valid
  - [ ] No spam folder delivery
  - [ ] Bounce handling working

### Security Testing
- [ ] **Access Control Testing**
  - [ ] Unauthorized access attempts blocked
  - [ ] Audit logs capturing all access
  - [ ] Rate limiting effective
  - [ ] Error messages don't leak information

- [ ] **Vulnerability Scanning**
  - [ ] No exposed secrets in code
  - [ ] Dependencies up-to-date
  - [ ] No security misconfigurations
  - [ ] OWASP Top 10 addressed

## Maintenance Schedule

### Daily
- [ ] Monitor CloudWatch dashboards
- [ ] Review any security alerts
- [ ] Check email delivery metrics

### Weekly
- [ ] Review CloudTrail logs
- [ ] Check for unusual patterns
- [ ] Verify backup procedures

### Monthly
- [ ] Access permission review
- [ ] Cost analysis
- [ ] Security patch updates
- [ ] Documentation updates

### Quarterly
- [ ] Full security audit
- [ ] Rotation drill
- [ ] Compliance review
- [ ] Training updates

## Sign-off

- [ ] Security team approval
- [ ] Operations team approval
- [ ] Development team training completed
- [ ] Documentation complete and accessible

**Date of last review**: _____________
**Reviewed by**: _____________
**Next review date**: _____________