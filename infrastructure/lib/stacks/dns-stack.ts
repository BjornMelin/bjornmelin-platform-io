import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import type { BaseStackProps } from "../types/stack-props";

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
    cdk.Tags.of(this).add("Stack", "DNS");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

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
