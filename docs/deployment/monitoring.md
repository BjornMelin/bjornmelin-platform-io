# Monitoring and Logging

## Overview

This document outlines the monitoring and logging setup for bjornmelin-platform-io.

## Monitoring Stack

Our monitoring is implemented through the AWS CDK monitoring stack:

```typescript
// infrastructure/lib/stacks/monitoring-stack.ts
export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Monitoring resources setup
  }
}
```

## CloudWatch Metrics

### Application Metrics

- Request count
- Response times
- Error rates
- API endpoint usage

### Infrastructure Metrics

- Email delivery (via Resend API)
- S3 bucket operations
- CDK stack events
- Resource utilization

## Logging

### Log Groups

```typescript
// Application logs
const applicationLogs = new logs.LogGroup(this, "ApplicationLogs", {
  retention: logs.RetentionDays.ONE_WEEK,
});

// Infrastructure logs
const infrastructureLogs = new logs.LogGroup(this, "InfrastructureLogs", {
  retention: logs.RetentionDays.ONE_MONTH,
});
```

### Log Levels

```typescript
// Log levels configuration
const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};
```

## Alerts

### Email Delivery Alerts

```typescript
// Email delivery alarm (Resend metrics via custom CloudWatch)
new cloudwatch.Alarm(this, "EmailDeliveryAlarm", {
  metric: emailMetrics.failureRate,
  threshold: 5,
  evaluationPeriods: 1,
  alarmDescription: "Email delivery failure rate exceeded threshold",
});
```

### Error Rate Alerts

```typescript
// API error rate alarm
new cloudwatch.Alarm(this, "APIErrorRateAlarm", {
  metric: apiMetrics.errorRate,
  threshold: 1,
  evaluationPeriods: 5,
  alarmDescription: "API error rate exceeded threshold",
});
```

## Dashboard

### Main Dashboard Components

- API health status
- Email delivery statistics
- Error rates graph
- Resource usage

### Metrics Display

```typescript
// Dashboard configuration
new cloudwatch.Dashboard(this, "MainDashboard", {
  widgets: [
    // API metrics
    new cloudwatch.GraphWidget({
      title: "API Metrics",
      left: [apiMetrics.requestCount, apiMetrics.errorRate],
    }),
    // Email metrics
    new cloudwatch.GraphWidget({
      title: "Email Delivery",
      left: [emailMetrics.deliveryRate, emailMetrics.bounceRate],
    }),
  ],
});
```

## Error Tracking

### Error Categories

1. API Errors

   - Validation errors
   - Service errors
   - Network errors

2. Infrastructure Errors
   - Deployment failures
   - Service unavailability
   - Resource limits

### Error Handling

```typescript
// Error logging utility
export function logError(error: Error, context: ErrorContext) {
  console.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
```

## Health Checks

### Endpoint Monitoring

```typescript
// Health check configuration
new cloudwatch.Alarm(this, "HealthCheckAlarm", {
  metric: endpointMetrics.availability,
  threshold: 99,
  evaluationPeriods: 3,
  alarmDescription: "Endpoint availability below threshold",
});
```

### Resource Health

- S3 bucket availability
- Resend API status
- API endpoint status
- CDK stack status

## Performance Monitoring

### Key Metrics

- Response times
- Resource usage
- Error rates
- API latency

### Performance Alerts

```typescript
// Response time alarm
new cloudwatch.Alarm(this, "ResponseTimeAlarm", {
  metric: apiMetrics.latency,
  threshold: 1000, // 1 second
  evaluationPeriods: 3,
  alarmDescription: "API response time exceeded threshold",
});
```

## Logging Best Practices

1. Structured Logging

    ```typescript
    logger.info({
      event: "api_request",
      path: "/api/contact",
      duration: 123,
      status: 200,
    });
    ```

2. Error Logging

    ```typescript
    logger.error({
      event: "api_error",
      error: error.message,
      stack: error.stack,
      context: requestContext,
    });
    ```

3. Audit Logging

    ```typescript
    logger.info({
      event: "audit",
      action: "email_sent",
      recipient: "user@example.com",
      timestamp: new Date().toISOString(),
    });
    ```

## Monitoring Tools Access

### CloudWatch Access

- Dashboard URL
- Metrics namespace
- Log group names
- Alarm configurations

### Alerts Configuration

- Email notifications
- Severity levels
- Escalation procedures
- On-call rotations

## Troubleshooting Guide

### Common Issues

1. High Error Rates

   - Check API logs
   - Verify configurations
   - Review error patterns

2. Performance Issues
   - Monitor resource usage
   - Check API latency
   - Review database metrics

### Resolution Steps

1. Check CloudWatch logs
2. Review error patterns
3. Analyze metrics
4. Update configurations if needed
