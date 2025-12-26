import * as cdk from "aws-cdk-lib";

export interface TaggingOptions {
  environment: string;
  stackName: string;
  additionalTags?: Record<string, string>;
}

/**
 * Applies standard tags to a CDK stack.
 * Consolidates the repeated tagging pattern used across all infrastructure stacks.
 */
export function applyStandardTags(stack: cdk.Stack, options: TaggingOptions): void {
  const { environment, stackName, additionalTags = {} } = options;

  cdk.Tags.of(stack).add("Stack", stackName);
  cdk.Tags.of(stack).add("Environment", environment);

  for (const [key, value] of Object.entries(additionalTags)) {
    cdk.Tags.of(stack).add(key, value);
  }
}
