import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import type { DeploymentStackProps } from "../types/stack-props";

/**
 * DeploymentStack currently applies shared tags for downstream stacks.
 * Legacy IAM user creation has been removed in favor of GitHub OIDC deployments.
 */
export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    // Add tags
    cdk.Tags.of(this).add("Stack", "Deployment");
    cdk.Tags.of(this).add("Environment", props.environment);
    for (const [key, value] of Object.entries(props.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }
  }
}
