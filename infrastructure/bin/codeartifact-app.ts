#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Aspects } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { CodeArtifactStack } from "../lib/codeartifact-stack";

const app = new cdk.App();

// Get configuration from context or environment
const githubRepository =
  app.node.tryGetContext("githubRepository") || "bjornmelin/bjornmelin-platform-io";
const allowedBranches = app.node.tryGetContext("allowedBranches") || ["main"];
const domainName = app.node.tryGetContext("domainName") || "bjornmelin-platform";
const repositoryName = app.node.tryGetContext("repositoryName") || "platform-releases";

// Deploy to us-east-1 by default (can be overridden with CDK_DEFAULT_REGION)
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

const codeArtifactStack = new CodeArtifactStack(app, "BjornmelinCodeArtifactStack", {
  env,
  githubRepository,
  allowedBranches,
  domainName,
  repositoryName,
  description: "CodeArtifact infrastructure for bjornmelin-platform npm package backups",
  tags: {
    Project: "bjornmelin-platform",
    Environment: "production",
    ManagedBy: "CDK",
  },
});

// Apply CDK Nag checks
Aspects.of(app).add(
  new AwsSolutionsChecks({
    verbose: true,
  }),
);

// Add stack metadata
cdk.Tags.of(codeArtifactStack).add("StackPurpose", "NPM-Package-Backup");
cdk.Tags.of(codeArtifactStack).add("GitHubRepository", githubRepository);
