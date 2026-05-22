#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const urlVariableNames = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL"];

const roleArnPattern = /^arn:aws:iam::[0-9]{12}:role\/.+/;
const emailPattern = /^[^@:\s]+@[^@:\s]+\.[^@:\s]+$/;

function parseArgs(args) {
  const options = {
    environment: "production",
    requireAwsRole: false,
    requireContactEmail: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--environment") {
      const environment = args[index + 1];
      if (!environment || environment.startsWith("--")) {
        throw new Error("--environment requires a value");
      }
      options.environment = environment;
      index++;
      continue;
    }
    if (arg === "--require-aws-role") {
      options.requireAwsRole = true;
      continue;
    }
    if (arg === "--require-contact-email") {
      options.requireContactEmail = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isHttpsUrl(value) {
  if (!value.startsWith("https://")) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates public deploy environment variables before deployment jobs run.
 *
 * @param env - Environment variable map to inspect.
 * @param options - Validation options that control environment-specific requirements.
 * @returns List of validation error messages.
 */
export function validatePublicDeployEnv(env, options = {}) {
  const environment = options.environment || "production";
  const errors = [];

  for (const name of urlVariableNames) {
    const value = env[name]?.trim();
    if (!value) {
      errors.push(`Missing required variable: ${name} (GitHub Environment: ${environment})`);
      continue;
    }
    if (!isHttpsUrl(value)) {
      errors.push(`${name} must be a valid https:// URL (GitHub Environment: ${environment}).`);
    }
  }

  if (options.requireAwsRole) {
    const value = env.AWS_DEPLOY_ROLE_ARN?.trim();
    if (!value) {
      errors.push("Missing required secret: AWS_DEPLOY_ROLE_ARN");
    } else if (!roleArnPattern.test(value)) {
      errors.push("AWS_DEPLOY_ROLE_ARN must be a full IAM Role ARN.");
    }
  }

  if (options.requireContactEmail) {
    const value = env.CONTACT_EMAIL?.trim();
    if (!value) {
      errors.push(`Missing required variable: CONTACT_EMAIL (GitHub Environment: ${environment})`);
    } else if (!emailPattern.test(value)) {
      errors.push(
        `CONTACT_EMAIL must be a valid email address (GitHub Environment: ${environment}).`,
      );
    }
  }

  return errors;
}

/**
 * Runs the public deploy environment validator from command line arguments.
 *
 * @param args - Command line arguments excluding the Node executable and script path.
 * @param env - Environment variable map to inspect.
 * @returns Process exit code where zero means validation passed.
 */
export function runCli(args, env = process.env) {
  const options = parseArgs(args);
  const errors = validatePublicDeployEnv(env, options);
  if (errors.length === 0) {
    console.log(`Validated public deploy environment: ${options.environment}`);
    return 0;
  }

  for (const error of errors) {
    console.error(error);
  }
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
