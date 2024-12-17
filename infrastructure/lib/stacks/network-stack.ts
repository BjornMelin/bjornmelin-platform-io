import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "BlogVpc", {
      maxAzs: 2, // Use 2 AZs for better availability
    });

    this.dbSecurityGroup = new ec2.SecurityGroup(this, "DBSecurityGroup", {
      vpc: this.vpc,
      description: "Allow connections to RDS from within the VPC",
      allowAllOutbound: true,
    });

    // Allow connections to the DB from within the VPC
    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432)
    );
  }
}
