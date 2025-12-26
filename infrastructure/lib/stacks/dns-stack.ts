import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import type { BaseStackProps } from "../types/stack-props";
import { applyStandardTags } from "../utils/tagging";

export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Look up existing hosted zone
    this.hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    // Create certificate in us-east-1 for CloudFront
    this.certificate = new acm.Certificate(this, "SiteCertificate", {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`, `api.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });

    // Tag all resources
    applyStandardTags(this, {
      environment: props.environment,
      stackName: "DNS",
      additionalTags: props.tags,
    });

    // Outputs
    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "SSL Certificate ARN",
      exportName: `${props.environment}-certificate-arn`,
    });

    new cdk.CfnOutput(this, "HostedZoneId", {
      value: this.hostedZone.hostedZoneId,
      description: "Hosted Zone ID",
      exportName: `${props.environment}-hosted-zone-id`,
    });

    new cdk.CfnOutput(this, "HostedZoneName", {
      value: this.hostedZone.zoneName,
      description: "Hosted Zone Name",
      exportName: `${props.environment}-hosted-zone-name`,
    });
  }
}
