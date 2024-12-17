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
    });

    const lambdaCode = cdk.aws_lambda.Code.fromAsset(
      path.join(__dirname, "../../../lambda")
    );

    new ApiConstruct(this, "Api", {
      lambdaCode,
      databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${databaseStack.instance.dbInstanceEndpointAddress}:${databaseStack.instance.dbInstancePort}/${databaseStack.instance.dbName}`,
      s3BucketName: storageStack.mediaBucket.bucketName,
      cloudfrontUrl: storageStack.distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, "CloudFrontDomain", {
      value: storageStack.distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: databaseStack.instance.dbInstanceEndpointAddress,
    });
  }
}
