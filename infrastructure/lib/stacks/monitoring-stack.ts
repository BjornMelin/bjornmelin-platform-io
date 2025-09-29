import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import type { Construct } from "constructs";
import type { MonitoringStackProps } from "../types/stack-props";

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, "AlertTopic", {
      displayName: `${props.environment}-portfolio-alerts`,
      topicName: `${props.environment}-portfolio-alerts`,
    });

    // Add email subscription
    alertTopic.addSubscription(new subscriptions.EmailSubscription("bjornmelin16@gmail.com"));

    // CloudFront Metrics Dashboard
    const dashboard = new cloudwatch.Dashboard(this, "PortfolioDashboard", {
      dashboardName: `${props.environment}-portfolio-dashboard`,
    });

    // Error rate metrics
    const errorRate = new cloudwatch.Metric({
      namespace: "AWS/CloudFront",
      metricName: "5xxErrorRate",
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
        Region: "Global",
      },
      statistic: "Average",
      period: cdk.Duration.minutes(5),
    });

    // Request count metrics
    const requests = new cloudwatch.Metric({
      namespace: "AWS/CloudFront",
      metricName: "Requests",
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
        Region: "Global",
      },
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    // Bytes downloaded metrics
    const bytesDownloaded = new cloudwatch.Metric({
      namespace: "AWS/CloudFront",
      metricName: "BytesDownloaded",
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
        Region: "Global",
      },
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    // S3 bucket metrics
    const s3Errors = new cloudwatch.Metric({
      namespace: "AWS/S3",
      metricName: "4xxErrors",
      dimensionsMap: {
        BucketName: props.bucket.bucketName,
      },
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "CloudFront Error Rate",
        left: [errorRate],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "Request Count",
        left: [requests],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "Bytes Downloaded",
        left: [bytesDownloaded],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "S3 Errors",
        left: [s3Errors],
        width: 12,
      }),
    );

    // Create alarms
    const errorRateAlarm = new cloudwatch.Alarm(this, "ErrorRateAlarm", {
      metric: errorRate,
      threshold: 5, // 5% error rate
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: "High error rate detected in CloudFront distribution",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const s3ErrorAlarm = new cloudwatch.Alarm(this, "S3ErrorAlarm", {
      metric: s3Errors,
      threshold: 10, // 10 errors
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: "High error rate detected in S3 bucket",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm actions
    errorRateAlarm.addAlarmAction(new actions.SnsAction(alertTopic));
    s3ErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Add tags
    cdk.Tags.of(this).add("Stack", "Monitoring");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    // Outputs
    new cdk.CfnOutput(this, "DashboardURL", {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: "URL of the CloudWatch Dashboard",
      exportName: `${props.environment}-dashboard-url`,
    });

    new cdk.CfnOutput(this, "AlertTopicArn", {
      value: alertTopic.topicArn,
      description: "ARN of the SNS alert topic",
      exportName: `${props.environment}-alert-topic-arn`,
    });
  }
}
