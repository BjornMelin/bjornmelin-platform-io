import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import type { DeploymentStackProps } from "../types/stack-props";
import { applyStandardTags } from "../utils/tagging";

/**
 * DeploymentStack currently applies shared tags for downstream stacks.
 * Legacy IAM user creation has been removed in favor of GitHub OIDC deployments.
 */
export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    // Add tags
    applyStandardTags(this, {
      environment: props.environment,
      stackName: "Deployment",
      additionalTags: props.tags,
    });
  }
}
