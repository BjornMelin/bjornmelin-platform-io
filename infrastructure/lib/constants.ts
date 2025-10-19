const DEV_DOMAIN = "dev.bjornmelin.io" as const;
const PROD_DOMAIN = "bjornmelin.io" as const;

/**
 * Parses a comma-delimited environment variable into a sanitized email list.
 *
 * @param name Environment variable to parse.
 * @param fallback Optional fallback list returned when the variable is unset.
 * @returns Comma-delimited email entries as a trimmed array.
 * @throws {Error} When both the environment variable and fallback are absent.
 */
const readEmailList = (name: string, fallback?: string[]): string[] => {
  const raw = process.env[name];
  if (raw && raw.trim().length > 0) {
    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (fallback && fallback.length > 0) {
    return fallback;
  }
  throw new Error(`Missing required email list environment variable: ${name}`);
};

const devAlertEmails = readEmailList("DEV_ALERT_EMAILS", [`alerts@${DEV_DOMAIN}`]);
const prodAlertEmails = readEmailList("PROD_ALERT_EMAILS", [`alerts@${PROD_DOMAIN}`]);

export const CONFIG = {
  dev: {
    domainName: DEV_DOMAIN,
    environment: "dev" as const,
    alerts: {
      emails: devAlertEmails,
    },
    email: {
      sender: `no-reply@${DEV_DOMAIN}`,
      allowedOrigins: [
        `https://${DEV_DOMAIN}`,
        `https://www.${DEV_DOMAIN}`,
        `https://api.${DEV_DOMAIN}`,
      ],
    },
  },
  prod: {
    domainName: PROD_DOMAIN,
    environment: "prod" as const,
    alerts: {
      emails: prodAlertEmails,
    },
    email: {
      sender: `no-reply@${PROD_DOMAIN}`,
      allowedOrigins: [
        `https://${PROD_DOMAIN}`,
        `https://www.${PROD_DOMAIN}`,
        `https://api.${PROD_DOMAIN}`,
      ],
    },
  },
  tags: {
    Project: "Portfolio",
    ManagedBy: "CDK",
    Owner: "Bjorn Melin",
  },
} as const;

/**
 * Builds a standardized stack name for the portfolio infrastructure.
 *
 * @param stackType Stack category identifier (e.g., "email").
 * @param env Target environment identifier (e.g., "prod").
 * @returns Stack name in the format `<env>-portfolio-<stackType>`.
 */
export const getStackName = (stackType: string, env: string) => `${env}-portfolio-${stackType}`;
