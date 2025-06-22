export const CONFIG = {
  dev: {
    domainName: "dev.yourdomain.com",
    environment: "dev" as const,
  },
  prod: {
    domainName: "yourdomain.com",
    environment: "prod" as const,
  },
  tags: {
    Project: "Portfolio",
    ManagedBy: "CDK",
    Owner: "Your Name",
  },
};

export const getStackName = (stackType: string, env: string) => `${env}-portfolio-${stackType}`;
