export const CONFIG = {
  dev: {
    domainName: "dev.bjornmelin.io",
    environment: "dev" as const,
    email: {
      sender: "no-reply@dev.bjornmelin.io",
      recipient: "dev-contact@bjornmelin.io",
      allowedOrigins: [
        "https://dev.bjornmelin.io",
        "https://www.dev.bjornmelin.io",
        "https://api.dev.bjornmelin.io",
      ],
    },
  },
  prod: {
    domainName: "bjornmelin.io",
    environment: "prod" as const,
    email: {
      sender: "no-reply@bjornmelin.io",
      recipient: "bjornmelin16@gmail.com",
      allowedOrigins: [
        "https://bjornmelin.io",
        "https://www.bjornmelin.io",
        "https://api.bjornmelin.io",
      ],
    },
  },
  tags: {
    Project: "Portfolio",
    ManagedBy: "CDK",
    Owner: "Bjorn Melin",
  },
};

export const getStackName = (stackType: string, env: string) => `${env}-portfolio-${stackType}`;
