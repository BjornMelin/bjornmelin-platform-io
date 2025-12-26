import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import type { Construct } from "constructs";
import { ALARM_PERIODS, ALARM_THRESHOLDS } from "../constants/durations";
import type { MonitoringStackProps } from "../types/stack-props";
import { applyStandardTags } from "../utils/tagging";

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, "AlertTopic", {
      displayName: `${props.environment}-portfolio-alerts`,
      topicName: `${props.environment}-portfolio-alerts`,
    });

    if (props.alertEmailAddresses.length === 0) {
      throw new Error("MonitoringStack requires at least one alert email address.");
    }

    for (const emailAddress of props.alertEmailAddresses) {
      alertTopic.addSubscription(new subscriptions.EmailSubscription(emailAddress));
    }

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
      period: ALARM_PERIODS.STANDARD,
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
      period: ALARM_PERIODS.STANDARD,
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
      period: ALARM_PERIODS.STANDARD,
    });

    // S3 bucket metrics
    const s3Errors = new cloudwatch.Metric({
      namespace: "AWS/S3",
      metricName: "4xxErrors",
      dimensionsMap: {
        BucketName: props.bucket.bucketName,
      },
      statistic: "Sum",
      period: ALARM_PERIODS.STANDARD,
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
      threshold: ALARM_THRESHOLDS.ERROR_RATE_PERCENT,
      evaluationPeriods: ALARM_THRESHOLDS.EVALUATION_PERIODS,
      datapointsToAlarm: ALARM_THRESHOLDS.DATAPOINTS_TO_ALARM,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: "High error rate detected in CloudFront distribution",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const s3ErrorAlarm = new cloudwatch.Alarm(this, "S3ErrorAlarm", {
      metric: s3Errors,
      threshold: ALARM_THRESHOLDS.S3_ERROR_COUNT,
      evaluationPeriods: ALARM_THRESHOLDS.EVALUATION_PERIODS,
      datapointsToAlarm: ALARM_THRESHOLDS.DATAPOINTS_TO_ALARM,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: "High error rate detected in S3 bucket",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm actions
    errorRateAlarm.addAlarmAction(new actions.SnsAction(alertTopic));
    s3ErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // API Gateway monitoring (only if contactApi is provided)
    if (props.contactApi) {
      const apiGateway4xxMetric = new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "4XXError",
        dimensionsMap: {
          ApiName: props.contactApi.restApiName,
        },
        period: ALARM_PERIODS.STANDARD,
        statistic: "Sum",
      });

      const apiGateway4xxAlarm = new cloudwatch.Alarm(this, "ApiGateway4xxAlarm", {
        metric: apiGateway4xxMetric,
        threshold: ALARM_THRESHOLDS.API_GATEWAY_4XX_COUNT,
        evaluationPeriods: ALARM_THRESHOLDS.EVALUATION_PERIODS,
        datapointsToAlarm: ALARM_THRESHOLDS.DATAPOINTS_TO_ALARM,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: "High 4xx error rate on Contact Form API",
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      apiGateway4xxAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

      const apiGateway5xxMetric = new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "5XXError",
        dimensionsMap: {
          ApiName: props.contactApi.restApiName,
        },
        period: ALARM_PERIODS.STANDARD,
        statistic: "Sum",
      });

      const apiGateway5xxAlarm = new cloudwatch.Alarm(this, "ApiGateway5xxAlarm", {
        metric: apiGateway5xxMetric,
        threshold: ALARM_THRESHOLDS.API_GATEWAY_5XX_COUNT,
        evaluationPeriods: ALARM_THRESHOLDS.EVALUATION_PERIODS,
        datapointsToAlarm: ALARM_THRESHOLDS.DATAPOINTS_TO_ALARM,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: "Server errors on Contact Form API",
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      apiGateway5xxAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

      // Add API Gateway widgets to dashboard
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: "API Gateway 4xx Errors",
          left: [apiGateway4xxMetric],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: "API Gateway 5xx Errors",
          left: [apiGateway5xxMetric],
          width: 12,
        }),
      );
    }

    // Lambda monitoring (only if emailFunction is provided)
    if (props.emailFunction) {
      const lambdaErrorMetric = new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Errors",
        dimensionsMap: {
          FunctionName: props.emailFunction.functionName,
        },
        period: ALARM_PERIODS.STANDARD,
        statistic: "Sum",
      });

      const lambdaErrorAlarm = new cloudwatch.Alarm(this, "LambdaErrorAlarm", {
        metric: lambdaErrorMetric,
        threshold: ALARM_THRESHOLDS.LAMBDA_ERROR_COUNT,
        evaluationPeriods: ALARM_THRESHOLDS.EVALUATION_PERIODS,
        datapointsToAlarm: ALARM_THRESHOLDS.DATAPOINTS_TO_ALARM,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: "Contact form Lambda errors detected",
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

      const lambdaThrottleMetric = new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Throttles",
        dimensionsMap: {
          FunctionName: props.emailFunction.functionName,
        },
        period: ALARM_PERIODS.STANDARD,
        statistic: "Sum",
      });

      const lambdaThrottleAlarm = new cloudwatch.Alarm(this, "LambdaThrottleAlarm", {
        metric: lambdaThrottleMetric,
        threshold: ALARM_THRESHOLDS.LAMBDA_THROTTLE_COUNT,
        evaluationPeriods: ALARM_THRESHOLDS.EVALUATION_PERIODS,
        datapointsToAlarm: ALARM_THRESHOLDS.DATAPOINTS_TO_ALARM,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: "Contact form Lambda throttling detected",
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      lambdaThrottleAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

      // Add Lambda widgets to dashboard
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: "Lambda Errors",
          left: [lambdaErrorMetric],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: "Lambda Throttles",
          left: [lambdaThrottleMetric],
          width: 12,
        }),
      );
    }

    // Add tags
    applyStandardTags(this, {
      environment: props.environment,
      stackName: "Monitoring",
      additionalTags: props.tags,
    });

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
