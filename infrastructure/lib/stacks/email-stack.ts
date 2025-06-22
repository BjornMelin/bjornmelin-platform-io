import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as sns from "aws-cdk-lib/aws-sns";
import type * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import type { BaseStackProps } from "../types/stack-props";

export interface EmailStackProps extends BaseStackProps {
  hostedZone: route53.IHostedZone;
  resendApiKeyParameter: ssm.IParameter;
  // These values will be obtained from Resend after domain is added
  resendDomainVerification?: string;
  resendDkimRecords?: Array<{
    name: string;
    value: string;
  }>;
}

export class EmailStack extends cdk.Stack {
  public readonly emailAlarmTopic: sns.ITopic;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    // Create SNS topic for email-related alarms
    this.emailAlarmTopic = new sns.Topic(this, "EmailAlarmTopic", {
      topicName: `${props.environment}-portfolio-email-alarms`,
      displayName: "Portfolio Email Service Alarms",
    });

    // SPF Record - Allow Resend to send emails on behalf of the domain
    new route53.TxtRecord(this, "SpfRecord", {
      zone: props.hostedZone,
      recordName: props.domainName,
      values: ["v=spf1 include:_spf.resend.com ~all"],
      ttl: cdk.Duration.minutes(5),
      comment: "SPF record for Resend email service",
    });

    // Domain Verification Record (if provided)
    if (props.resendDomainVerification) {
      new route53.TxtRecord(this, "DomainVerificationRecord", {
        zone: props.hostedZone,
        recordName: "_resend",
        values: [props.resendDomainVerification],
        ttl: cdk.Duration.minutes(5),
        comment: "Resend domain verification",
      });
    }

    // DKIM Records (if provided)
    if (props.resendDkimRecords && props.resendDkimRecords.length > 0) {
      props.resendDkimRecords.forEach((dkimRecord, index) => {
        new route53.CnameRecord(this, `DkimRecord${index + 1}`, {
          zone: props.hostedZone,
          recordName: dkimRecord.name,
          domainName: dkimRecord.value,
          ttl: cdk.Duration.minutes(5),
          comment: `DKIM record ${index + 1} for Resend email service`,
        });
      });
    }

    // Create optimized log group for email service monitoring
    new logs.LogGroup(this, "EmailServiceLogGroup", {
      logGroupName: `/aws/email-service/${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK, // Cost optimized
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Metric for monitoring parameter access (using custom metrics)
    const parameterAccessMetric = new cloudwatch.Metric({
      namespace: "Portfolio/EmailService",
      metricName: "ParameterAccess",
      dimensionsMap: {
        ParameterName: props.resendApiKeyParameter.parameterName,
        Environment: props.environment,
      },
      statistic: cloudwatch.Statistic.SUM,
      period: cdk.Duration.hours(1),
    });

    // Alarm for service errors
    const errorMetric = new cloudwatch.Metric({
      namespace: "Portfolio/EmailService",
      metricName: "Errors",
      dimensionsMap: {
        Environment: props.environment,
      },
      statistic: cloudwatch.Statistic.SUM,
      period: cdk.Duration.minutes(5),
    });

    const serviceErrorAlarm = new cloudwatch.Alarm(this, "ServiceErrorAlarm", {
      metric: errorMetric,
      threshold: 5, // More than 5 errors in 5 minutes
      evaluationPeriods: 1,
      alarmDescription: "Alert on email service errors",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    serviceErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.emailAlarmTopic));

    // Custom CloudWatch Dashboard for Email Service Monitoring
    const dashboard = new cloudwatch.Dashboard(this, "EmailServiceDashboard", {
      dashboardName: `${props.environment}-portfolio-email-dashboard`,
      defaultInterval: cdk.Duration.hours(3),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Parameter Access Frequency",
        left: [parameterAccessMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "Service Errors",
        left: [errorMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Total Parameter Accesses (24h)",
        metrics: [parameterAccessMetric],
        period: cdk.Duration.days(1),
        width: 6,
        height: 4,
      }),
    );

    // Tag all resources
    cdk.Tags.of(this).add("Stack", "Email");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "EmailDomainConfigured", {
      value: props.domainName,
      description: "Domain configured for email service",
    });

    new cdk.CfnOutput(this, "SpfRecordValue", {
      value: "v=spf1 include:_spf.resend.com ~all",
      description: "SPF record value for email authentication",
    });

    new cdk.CfnOutput(this, "EmailAlarmTopicArn", {
      value: this.emailAlarmTopic.topicArn,
      description: "SNS topic for email service alarms",
      exportName: `${props.environment}-email-alarm-topic-arn`,
    });

    if (!props.resendDomainVerification) {
      new cdk.CfnOutput(this, "DomainVerificationStatus", {
        value: "PENDING - Add domain to Resend and update stack with verification values",
        description: "Domain verification status",
      });
    }

    if (!props.resendDkimRecords || props.resendDkimRecords.length === 0) {
      new cdk.CfnOutput(this, "DkimConfigurationStatus", {
        value: "PENDING - Add DKIM records from Resend dashboard",
        description: "DKIM configuration status",
      });
    }
  }
}
