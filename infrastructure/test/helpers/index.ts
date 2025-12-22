import type * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { vi } from "vitest";
import type { Environment } from "../../lib/types/stack-props";

/**
 * Mock HostedZone.fromLookup to avoid AWS context provider calls in tests.
 */
export function mockHostedZoneLookup() {
  return vi
    .spyOn(route53.HostedZone, "fromLookup")
    .mockImplementation((scope, id: string, opts: { domainName: string }) => {
      return route53.HostedZone.fromHostedZoneAttributes(scope as cdk.Stack, id, {
        hostedZoneId: "ZMOCK",
        zoneName: opts.domainName,
      });
    });
}

/**
 * Create standard test environment configuration.
 */
export function createTestEnv() {
  return { account: "111111111111", region: "us-east-1" };
}

/**
 * Create base props for stack tests with sensible defaults.
 */
export function createBaseProps(
  overrides: Partial<{
    env: { account: string; region: string };
    domainName: string;
    environment: Environment;
    tags: Record<string, string>;
  }> = {},
) {
  return {
    env: createTestEnv(),
    domainName: "test.example.com",
    environment: "prod" as Environment,
    tags: { Project: "Test" },
    ...overrides,
  };
}
