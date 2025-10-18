#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CONFIG, getStackName } from "../lib/constants";
import { DeploymentStack } from "../lib/stacks/deployment-stack";
import { DnsStack } from "../lib/stacks/dns-stack";
import { EmailStack } from "../lib/stacks/email-stack";
import { MonitoringStack } from "../lib/stacks/monitoring-stack";
import { StorageStack } from "../lib/stacks/storage-stack";

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

// DNS Stack (must be in us-east-1 for CloudFront)
const dnsStack = new DnsStack(app, getStackName("dns", "prod"), {
  env: {
    ...env,
    region: "us-east-1", // Force us-east-1 for CloudFront certificate
  },
  domainName: CONFIG.prod.domainName,
  environment: CONFIG.prod.environment,
  tags: CONFIG.tags,
});

// Storage Stack
const storageStack = new StorageStack(app, getStackName("storage", "prod"), {
  env,
  domainName: CONFIG.prod.domainName,
  environment: CONFIG.prod.environment,
  certificate: dnsStack.certificate,
  hostedZone: dnsStack.hostedZone,
  tags: CONFIG.tags,
});

// Ensure storage stack depends on DNS stack
storageStack.addDependency(dnsStack);

// Deployment Stack
const deploymentStack = new DeploymentStack(app, getStackName("deployment", "prod"), {
  env,
  domainName: CONFIG.prod.domainName,
  environment: CONFIG.prod.environment,
  bucket: storageStack.bucket,
  distribution: storageStack.distribution,
  legacyIamUser: CONFIG.prod.legacyDeploymentUser,
  tags: CONFIG.tags,
});

// Ensure deployment stack depends on storage stack
deploymentStack.addDependency(storageStack);

// Monitoring Stack
const monitoringStack = new MonitoringStack(app, getStackName("monitoring", "prod"), {
  env,
  domainName: CONFIG.prod.domainName,
  environment: CONFIG.prod.environment,
  bucket: storageStack.bucket,
  distribution: storageStack.distribution,
  alertEmailAddresses: CONFIG.prod.alerts.emails,
  tags: CONFIG.tags,
});

// Ensure monitoring stack depends on storage stack
monitoringStack.addDependency(storageStack);

// Email Stack
const emailConfig = CONFIG.prod.email;

const emailStack = new EmailStack(app, getStackName("email", "prod"), {
  env,
  domainName: CONFIG.prod.domainName,
  environment: CONFIG.prod.environment,
  hostedZone: dnsStack.hostedZone,
  senderEmail: emailConfig.sender,
  allowedOrigins: emailConfig.allowedOrigins,
  // SSM parameter path for the recipient email; defaults to /portfolio/prod/CONTACT_EMAIL if omitted
  // ssmRecipientEmailParam: "/portfolio/prod/CONTACT_EMAIL",
  tags: CONFIG.tags,
});

// Ensure email stack depends on DNS stack
emailStack.addDependency(dnsStack);
