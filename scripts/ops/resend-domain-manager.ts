#!/usr/bin/env npx tsx

/**
 * Resend Domain Manager
 *
 * A CLI tool for managing Resend domain configuration and Route53 DNS records.
 *
 * Commands:
 *   status    - Show current domain verification status
 *   records   - Get required DNS records from Resend API
 *   verify    - Trigger domain verification
 *   sync-dns  - Create/update Route53 records from Resend requirements
 *
 * Usage:
 *   pnpm resend:status
 *   pnpm resend:records
 *   pnpm resend:verify
 *   pnpm resend:sync-dns --dry-run
 *
 * Environment:
 *   AWS credentials must be configured (via AWS CLI profile or env vars)
 *   Resend API key is fetched from SSM Parameter Store
 */

import {
  type Change,
  ChangeResourceRecordSetsCommand,
  type HostedZone,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
  type ResourceRecordSet,
  Route53Client,
  type RRType,
} from "@aws-sdk/client-route-53";
import {
  GetParameterCommand,
  type GetParameterCommandOutput,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { Command } from "commander";
import { Resend } from "resend";

// Configuration
const DEFAULT_DOMAIN = "bjornmelin.io";
const DEFAULT_REGION = "us-east-1";
const SSM_PARAM_PATH = "/portfolio/prod/resend/api-key";

// Types
interface ResendDomainRecord {
  record: string;
  name: string;
  type: string;
  ttl: string;
  status: string;
  value: string;
  priority?: number;
}

interface ResendDomain {
  id: string;
  name: string;
  status: string;
  created_at: string;
  region: string;
  records?: ResendDomainRecord[];
}

interface DnsChange {
  action: "CREATE" | "UPSERT" | "DELETE";
  name: string;
  type: string;
  value: string;
  ttl: number;
  priority?: number;
}

function normalizeDnsName(name: string): string {
  return name.replace(/\.$/, "");
}

function normalizeDnsValue(value: string): string {
  return value.replace(/^"|"$/g, "").trim();
}

function isResendDomain(value: unknown): value is ResendDomain {
  if (!value || typeof value !== "object") {
    return false;
  }
  const maybe = value as { id?: unknown; name?: unknown; status?: unknown };
  return (
    typeof maybe.id === "string" &&
    typeof maybe.name === "string" &&
    (typeof maybe.status === "string" || typeof maybe.status === "undefined")
  );
}

function isResendDomainDetails(value: unknown): value is ResendDomain {
  if (!isResendDomain(value)) {
    return false;
  }

  const maybe = value as { created_at?: unknown; region?: unknown; records?: unknown };
  if (typeof maybe.created_at !== "string" || typeof maybe.region !== "string") {
    return false;
  }

  if (typeof maybe.records !== "undefined" && !Array.isArray(maybe.records)) {
    return false;
  }

  return true;
}

function extractResendDomains(data: unknown): ResendDomain[] {
  if (!data || typeof data !== "object") {
    return [];
  }
  const maybe = data as { data?: unknown };
  if (!Array.isArray(maybe.data)) {
    return [];
  }
  return maybe.data.filter(isResendDomain);
}

// Clients
let ssmClient: SSMClient;
let route53Client: Route53Client;
let resendClient: Resend;

/**
 * Initialize AWS clients
 */
function initClients(region: string): void {
  ssmClient = new SSMClient({ region });
  route53Client = new Route53Client({ region });
}

/**
 * Fetch Resend API key from SSM Parameter Store
 */
async function getResendApiKey(paramPath: string): Promise<string> {
  const command = new GetParameterCommand({
    Name: paramPath,
    WithDecryption: true,
  });

  let result: GetParameterCommandOutput;
  try {
    result = await ssmClient.send(command);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to fetch SSM parameter ${paramPath}: ${err.message}`);
  }

  const rawValue = result.Parameter?.Value;
  if (!rawValue) {
    throw new Error(`SSM parameter ${paramPath} is empty`);
  }

  // Support both JSON format {"apiKey":"re_xxx",...} and plain string
  try {
    const parsed = JSON.parse(rawValue) as { apiKey?: string };
    if (parsed.apiKey) {
      return parsed.apiKey;
    }
  } catch {
    // Not JSON, use raw value
  }

  return rawValue;
}

/**
 * Initialize Resend client with API key from SSM
 */
async function initResendClient(ssmParamPath: string): Promise<void> {
  const apiKey = await getResendApiKey(ssmParamPath);
  resendClient = new Resend(apiKey);
}

/**
 * Find domain in Resend account
 */
async function findDomain(domainName: string): Promise<ResendDomain | null> {
  const { data, error } = await resendClient.domains.list();

  if (error) {
    throw new Error(`Failed to list domains: ${error.message}`);
  }

  const domains = extractResendDomains(data);
  return domains.find((d) => d.name === domainName) || null;
}

/**
 * Get detailed domain info including DNS records
 */
async function getDomainDetails(domainId: string): Promise<ResendDomain> {
  const { data, error } = await resendClient.domains.get(domainId);

  if (error) {
    throw new Error(`Failed to get domain details: ${error.message}`);
  }

  if (!isResendDomainDetails(data)) {
    throw new Error("Unexpected domain response structure");
  }

  return data;
}

/**
 * Find Route53 hosted zone for domain
 */
async function findHostedZone(domainName: string): Promise<HostedZone | null> {
  const command = new ListHostedZonesByNameCommand({
    DNSName: domainName,
    MaxItems: 1,
  });

  const result = await route53Client.send(command);
  const zone = result.HostedZones?.[0];

  if (zone && zone.Name === `${domainName}.`) {
    return zone;
  }

  return null;
}

/**
 * Get existing DNS records from Route53
 */
async function getExistingRecords(
  hostedZoneId: string,
  recordNames: string[],
): Promise<Map<string, ResourceRecordSet>> {
  const records = new Map<string, ResourceRecordSet>();
  const normalizedNames = new Set(recordNames.map(normalizeDnsName));

  const command = new ListResourceRecordSetsCommand({
    HostedZoneId: hostedZoneId,
  });

  const result = await route53Client.send(command);

  for (const record of result.ResourceRecordSets ?? []) {
    const normalizedName = normalizeDnsName(record.Name ?? "");
    if (normalizedNames.has(normalizedName)) {
      records.set(`${record.Type}:${normalizedName}`, record);
    }
  }

  return records;
}

/**
 * Apply DNS changes to Route53
 */
async function applyDnsChanges(
  hostedZoneId: string,
  changes: DnsChange[],
  dryRun: boolean,
): Promise<void> {
  if (changes.length === 0) {
    console.log("No DNS changes required.");
    return;
  }

  console.log(`\n${dryRun ? "[DRY RUN] " : ""}Planned changes:`);
  for (const change of changes) {
    const priorityStr = change.priority ? ` (priority: ${change.priority})` : "";
    console.log(
      `  [${change.action}] ${change.type} ${change.name} -> ${change.value}${priorityStr}`,
    );
  }

  if (dryRun) {
    console.log("\nRun without --dry-run to apply these changes.");
    return;
  }

  const changeBatch: Change[] = changes.map((change) => {
    let resourceRecords: { Value: string }[];

    if (change.type === "MX" && change.priority !== undefined) {
      resourceRecords = [{ Value: `${change.priority} ${change.value}` }];
    } else if (change.type === "TXT") {
      // TXT records need to be quoted
      resourceRecords = [{ Value: `"${change.value}"` }];
    } else {
      resourceRecords = [{ Value: change.value }];
    }

    return {
      Action: change.action,
      ResourceRecordSet: {
        Name: change.name,
        Type: change.type as RRType,
        TTL: change.ttl,
        ResourceRecords: resourceRecords,
      },
    };
  });

  const command = new ChangeResourceRecordSetsCommand({
    HostedZoneId: hostedZoneId,
    ChangeBatch: { Changes: changeBatch },
  });

  try {
    await route53Client.send(command);
    console.log(`\nApplied ${changes.length} DNS change(s) successfully.`);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to apply DNS changes: ${err.message}`, { cause: err });
  }
}

// Command: status
async function statusCommand(options: { domain: string; region: string }): Promise<void> {
  const { domain, region } = options;

  initClients(region);
  await initResendClient(SSM_PARAM_PATH);

  console.log(`\n=== Resend Domain Status: ${domain} ===\n`);

  const domainInfo = await findDomain(domain);
  if (!domainInfo) {
    console.error(`Domain '${domain}' not found in Resend account.`);

    const { data } = await resendClient.domains.list();
    const domains = extractResendDomains(data);
    if (domains.length > 0) {
      console.log("\nAvailable domains:");
      for (const d of domains) {
        console.log(`  - ${d.name} (${d.status})`);
      }
    }
    process.exit(1);
  }

  const details = await getDomainDetails(domainInfo.id);

  console.log(`Status:     ${details.status}`);
  console.log(`Region:     ${details.region}`);
  console.log(`Created:    ${details.created_at}`);
  console.log(`Domain ID:  ${details.id}`);

  console.log("\nDNS Records:");
  console.log("─".repeat(80));

  for (const record of details.records ?? []) {
    const icon = record.status === "verified" ? "✓" : "✗";
    console.log(`[${icon}] ${record.type} ${record.name}`);
    console.log(`    Value:  ${record.value}`);
    console.log(`    Status: ${record.status}`);
    console.log("");
  }

  const allVerified = details.records?.every((r) => r.status === "verified") ?? false;
  console.log("═".repeat(80));
  if (allVerified && details.status === "verified") {
    console.log("✓ Domain is fully verified and ready for sending");
  } else {
    console.log("⚠ Domain verification incomplete. Add missing DNS records.");
    console.log("  Run 'pnpm resend:verify' to trigger re-verification after adding records.");
  }
}

// Command: records
async function recordsCommand(options: {
  domain: string;
  region: string;
  json: boolean;
}): Promise<void> {
  const { domain, region, json: outputJson } = options;

  initClients(region);
  await initResendClient(SSM_PARAM_PATH);

  const domainInfo = await findDomain(domain);
  if (!domainInfo) {
    console.error(`Domain '${domain}' not found in Resend account.`);
    process.exit(1);
  }

  const details = await getDomainDetails(domainInfo.id);

  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          domain: details.name,
          status: details.status,
          records: details.records?.map((r) => ({
            type: r.type,
            name: r.name,
            value: r.value,
            ttl: r.ttl,
            status: r.status,
            priority: r.priority,
          })),
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`\n=== Required DNS Records for ${domain} ===\n`);
    for (const record of details.records ?? []) {
      console.log(`${record.type} Record:`);
      console.log(`  Name:   ${record.name}`);
      console.log(`  Value:  ${record.value}`);
      console.log(`  TTL:    ${record.ttl}`);
      if (record.priority !== undefined) {
        console.log(`  Priority: ${record.priority}`);
      }
      console.log(`  Status: ${record.status}`);
      console.log("");
    }
  }
}

// Command: verify
async function verifyCommand(options: { domain: string; region: string }): Promise<void> {
  const { domain, region } = options;

  initClients(region);
  await initResendClient(SSM_PARAM_PATH);

  console.log(`\nTriggering verification for domain: ${domain}\n`);

  const domainInfo = await findDomain(domain);
  if (!domainInfo) {
    console.error(`Domain '${domain}' not found in Resend account.`);
    process.exit(1);
  }

  const { error } = await resendClient.domains.verify(domainInfo.id);

  if (error) {
    console.error(`Verification failed: ${error.message}`);
    process.exit(1);
  }

  console.log("✓ Verification triggered successfully.");
  console.log("  Check status again in a few minutes with 'pnpm resend:status'");
}

// Command: sync-dns
async function syncDnsCommand(options: {
  domain: string;
  region: string;
  hostedZoneId?: string;
  dryRun: boolean;
}): Promise<void> {
  const { domain, region, hostedZoneId: providedZoneId, dryRun } = options;

  initClients(region);
  await initResendClient(SSM_PARAM_PATH);

  console.log(`\n=== Sync DNS Records for ${domain} ===\n`);

  // Get Resend domain info
  const domainInfo = await findDomain(domain);
  if (!domainInfo) {
    console.error(`Domain '${domain}' not found in Resend account.`);
    process.exit(1);
  }

  const details = await getDomainDetails(domainInfo.id);

  // Find Route53 hosted zone
  let hostedZoneId: string;
  if (!providedZoneId) {
    const zone = await findHostedZone(domain);
    if (!zone || !zone.Id) {
      console.error(`No Route53 hosted zone found for '${domain}'.`);
      console.log("Use --hosted-zone-id to specify manually.");
      process.exit(1);
    }
    hostedZoneId = zone.Id.replace("/hostedzone/", "");
    console.log(`Found hosted zone: ${hostedZoneId} (${zone.Name})`);
  } else {
    hostedZoneId = providedZoneId;
    console.log(`Using provided hosted zone: ${hostedZoneId}`);
  }

  // Get required record names
  const requiredRecordNames = (details.records ?? []).map((r) => r.name);

  // Get existing records
  const existingRecords = await getExistingRecords(hostedZoneId, requiredRecordNames);
  console.log(`Found ${existingRecords.size} existing matching record(s)`);

  // Compute changes
  const changes: DnsChange[] = [];

  for (const record of details.records ?? []) {
    const existingKey = `${record.type}:${record.name}`;
    const existing = existingRecords.get(existingKey);

    if (!existing) {
      changes.push({
        action: "CREATE",
        name: record.name,
        type: record.type,
        value: record.value,
        ttl: Number.parseInt(record.ttl, 10) || 300,
        priority: record.priority,
      });
    } else {
      // Check if value matches
      const existingValue = existing.ResourceRecords?.[0]?.Value ?? "";
      let normalizedExisting = normalizeDnsValue(existingValue);
      const normalizedValue = normalizeDnsValue(record.value);

      // For MX records, strip the priority prefix for comparison
      if (record.type === "MX" && record.priority !== undefined) {
        normalizedExisting = normalizedExisting.replace(/^\d+\s+/, "");
      }

      if (normalizeDnsName(normalizedExisting) !== normalizeDnsName(normalizedValue)) {
        changes.push({
          action: "UPSERT",
          name: record.name,
          type: record.type,
          value: record.value,
          ttl: Number.parseInt(record.ttl, 10) || 300,
          priority: record.priority,
        });
      }
    }
  }

  // Apply changes
  await applyDnsChanges(hostedZoneId, changes, dryRun);
}

// CLI
const program = new Command();

program
  .name("resend-domain-manager")
  .description("Manage Resend domain configuration and Route53 DNS records")
  .version("1.0.0");

program
  .command("status")
  .description("Show current domain verification status")
  .option("-d, --domain <domain>", "Domain name", DEFAULT_DOMAIN)
  .option("-r, --region <region>", "AWS region", DEFAULT_REGION)
  .action(statusCommand);

program
  .command("records")
  .description("Get required DNS records from Resend API")
  .option("-d, --domain <domain>", "Domain name", DEFAULT_DOMAIN)
  .option("-r, --region <region>", "AWS region", DEFAULT_REGION)
  .option("--json", "Output as JSON", false)
  .action(recordsCommand);

program
  .command("verify")
  .description("Trigger domain verification")
  .option("-d, --domain <domain>", "Domain name", DEFAULT_DOMAIN)
  .option("-r, --region <region>", "AWS region", DEFAULT_REGION)
  .action(verifyCommand);

program
  .command("sync-dns")
  .description("Create/update Route53 records from Resend requirements")
  .option("-d, --domain <domain>", "Domain name", DEFAULT_DOMAIN)
  .option("-r, --region <region>", "AWS region", DEFAULT_REGION)
  .option("--hosted-zone-id <id>", "Route53 hosted zone ID (auto-detected if not provided)")
  .option("--dry-run", "Show changes without applying", false)
  .action(syncDnsCommand);

program.parse();
