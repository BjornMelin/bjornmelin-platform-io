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
  legacyIamUser?: {
    enabled: boolean;
    secretName?: string;
  };
}

export interface MonitoringStackProps extends BaseStackProps {
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
  alertEmailAddresses: string[];
}

export interface EmailStackProps extends BaseStackProps {
  hostedZone: route53.IHostedZone;
  senderEmail: string;
  recipientEmail: string;
  allowedOrigins?: string[];
}
