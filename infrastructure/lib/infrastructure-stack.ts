import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NetworkStack } from "./stacks/network-stack";
import { DatabaseStack } from "./stacks/database-stack";
import { StorageStack } from "./stacks/storage-stack";
import { ApiConstruct } from "./constructs/api-construct";
import * as path from "path";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const networkStack = new NetworkStack(this, "Network");
    const storageStack = new StorageStack(this, "Storage");

    const databaseStack = new DatabaseStack(this, "Database", {
      vpc: networkStack.vpc,
      dbSecurityGroup: networkStack.dbSecurityGroup,
    }); // Build the code from the root directory using a relative path

    const lambdaCode = cdk.aws_lambda.Code.fromAsset(
      path.join(__dirname, "../../dist")
    );

    new ApiConstruct(this, "Api", {
      lambdaCode,
      databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${databaseStack.instance.dbInstanceEndpointAddress}:${databaseStack.instance.dbInstancePort}/${process.env.DB_NAME}`,
      s3BucketName: storageStack.mediaBucket.bucketName,
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: databaseStack.instance.dbInstanceEndpointAddress,
    });
  }
}
