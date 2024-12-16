#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { CONFIG } from "../lib/constants";
import { StorageStack } from "../lib/stacks/storage-stack";

const app = new cdk.App();

// Development stack
new FrontendStack(app, "DevFrontendStackBjornmelinIo", {
  domainName: CONFIG.dev.domainName,
  environment: CONFIG.dev.environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: CONFIG.tags,
});

// Production stack
new FrontendStack(app, "ProdFrontendStackBjornmelinIo", {
  domainName: CONFIG.prod.domainName,
  environment: CONFIG.prod.environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: CONFIG.tags,
});

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

// Create storage stack
new StorageStack(app, "MediaStorageStackBjornmelinIo", {
  env,
  description: "Media storage infrastructure for the blog platform",
  tags: {
    Environment: process.env.ENVIRONMENT || "development",
    Project: "blog-platform",
    Service: "media-storage",
  },
});
