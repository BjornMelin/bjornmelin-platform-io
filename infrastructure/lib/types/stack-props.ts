import type * as cdk from "aws-cdk-lib";
import type * as acm from "aws-cdk-lib/aws-certificatemanager";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as route53 from "aws-cdk-lib/aws-route53";
import type * as s3 from "aws-cdk-lib/aws-s3";

export interface BaseStackProps extends cdk.StackProps {
  domainName: string;
  environment: "prod";
}

export interface StorageStackProps extends BaseStackProps {
  certificate: acm.ICertificate;
  hostedZone: route53.IHostedZone;
}

export interface DeploymentStackProps extends BaseStackProps {
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
}

export interface MonitoringStackProps extends BaseStackProps {
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
  alertEmailAddresses: string[];
}

export interface EmailStackProps extends BaseStackProps {
  hostedZone: route53.IHostedZone;
  allowedOrigins?: readonly string[];
  /**
   * Optional SSM Parameter path that contains the contact-form recipient email.
   * If omitted, defaults to `/portfolio/<environment>/CONTACT_EMAIL`.
   */
  ssmRecipientEmailParam?: string;
  /**
   * Optional SSM Parameter path that contains the Resend API key.
   * If omitted, defaults to `/portfolio/<environment>/resend/api-key`.
   */
  ssmResendApiKeyParam?: string;
}
