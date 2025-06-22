import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as route53 from "aws-cdk-lib/aws-route53";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sns from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";
import type { BaseStackProps } from "../types/stack-props";

export interface EmailStackProps extends BaseStackProps {
  hostedZone: route53.IHostedZone;
  resendApiKeySecret: secretsmanager.ISecret;
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

    // CloudWatch Metric for monitoring secret access
    const secretAccessMetric = new cloudwatch.Metric({
      namespace: "AWS/SecretsManager",
      metricName: "SecretAccess",
      dimensionsMap: {
        SecretName: props.resendApiKeySecret.secretName,
      },
      statistic: cloudwatch.Statistic.SUM,
      period: cdk.Duration.hours(1),
    });

    // Alarm for unusual secret access patterns
    const unusualAccessAlarm = new cloudwatch.Alarm(this, "UnusualSecretAccessAlarm", {
      metric: secretAccessMetric,
      threshold: 100, // More than 100 accesses per hour
      evaluationPeriods: 1,
      alarmDescription: "Alert on unusual number of secret accesses",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    unusualAccessAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.emailAlarmTopic));

    // Custom CloudWatch Dashboard for Email Service Monitoring
    const dashboard = new cloudwatch.Dashboard(this, "EmailServiceDashboard", {
      dashboardName: `${props.environment}-portfolio-email-dashboard`,
      defaultInterval: cdk.Duration.hours(3),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Secret Access Frequency",
        left: [secretAccessMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Total Secret Accesses (24h)",
        metrics: [secretAccessMetric],
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
