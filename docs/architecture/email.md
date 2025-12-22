# Email Infrastructure

## Overview

Contact form emails are delivered via [Resend](https://resend.com), a developer-friendly transactional email service. The infrastructure uses proper DNS authentication (SPF, DKIM, DMARC) for optimal deliverability.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION PATH                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Contact Form (browser)                                         │
│         │                                                        │
│         ▼                                                        │
│   POST https://api.bjornmelin.io/contact                        │
│         │                                                        │
│         ▼                                                        │
│   API Gateway (Regional)                                         │
│         │                                                        │
│         ▼                                                        │
│   Lambda (contact-form)                                          │
│         │                                                        │
│         ├──► SSM: /portfolio/prod/resend/api-key                │
│         ├──► SSM: /portfolio/prod/CONTACT_EMAIL                 │
│         │                                                        │
│         ▼                                                        │
│   Resend API ──► Email delivered to recipient                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL DEV PATH                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Contact Form (browser)                                         │
│         │                                                        │
│         ▼                                                        │
│   POST http://localhost:3000/api/contact                        │
│         │                                                        │
│         ▼                                                        │
│   Next.js API Route (/app/api/contact/route.ts)                 │
│         │                                                        │
│         ├──► env: RESEND_API_KEY                                │
│         ├──► env: CONTACT_EMAIL                                 │
│         │                                                        │
│         ▼                                                        │
│   Resend API ──► Email delivered to recipient                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## DNS Records

All email DNS records are managed via AWS CDK in `infrastructure/lib/stacks/email-stack.ts`.

| Record | Type | Host | Value | Purpose |
|--------|------|------|-------|---------|
| SPF | TXT | `@` | `v=spf1 include:_spf.resend.com ~all` | Authorize Resend to send |
| DKIM | TXT | `resend._domainkey` | `p=MIGfMA0GCSq...` | Email signature verification |
| DMARC | TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:...` | Policy + reporting |
| Send MX | MX | `send` | `10 feedback-smtp.us-east-1.amazonses.com` | Bounce/complaint handling |
| Send SPF | TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF alignment for send subdomain |

**Note:** The MX record is optional for basic sending. Enable "Receiving" in Resend dashboard only if you need to receive emails through Resend.

## Secrets Management

| Parameter | Path | Type | Description |
|-----------|------|------|-------------|
| Resend API Key | `/portfolio/prod/resend/api-key` | SecureString | Resend API key (JSON or plain) |
| Recipient Email | `/portfolio/prod/CONTACT_EMAIL` | SecureString | Contact form recipient |

Encrypted with KMS alias: `alias/portfolio-email-service`

## Domain Verification

Use the Resend domain manager script to check and verify domain status:

```bash
# Check current domain status
pnpm resend:status

# Get required DNS records
pnpm resend:records

# Trigger verification after adding DNS records
pnpm resend:verify

# Sync Route53 records from Resend requirements
pnpm resend:sync-dns --dry-run
```

## Sender Addresses

| Purpose | Address |
|---------|---------|
| Contact Form | `Contact Form <contact@bjornmelin.io>` |

## Shared Code

Email templates and validation are centralized in `src/lib/email/templates/contact-form.ts`:

- `createContactEmailHtml()` - HTML email template
- `createContactEmailText()` - Plain text email template
- `escapeHtml()` - XSS prevention
- `validateContactForm()` - Validation without Zod dependency
- `CONTACT_FORM_LIMITS` - Shared validation constraints

This module is imported by both:
- Frontend API routes (`src/app/api/contact/route.ts`)
- Lambda handler (`infrastructure/lib/functions/contact-form/index.ts`)

## Troubleshooting

### Email not delivered

1. Check domain verification: `pnpm resend:status`
2. Verify DNS records are propagated: `dig TXT resend._domainkey.bjornmelin.io`
3. Check Lambda logs in CloudWatch
4. Verify SSM parameters exist and contain valid values

### DNS verification failing

1. Get required records: `pnpm resend:records --json`
2. Compare with Route53: `aws route53 list-resource-record-sets --hosted-zone-id <HOSTED_ZONE_ID>`
3. Wait up to 72 hours for propagation (usually faster)

Tip: You can find the hosted zone ID via `aws route53 list-hosted-zones-by-name --dns-name bjornmelin.io`.

### Bounce issues

Ensure `send.bjornmelin.io` MX and SPF records are configured for bounce handling.

## Key Files

| File | Purpose |
|------|---------|
| `infrastructure/lib/stacks/email-stack.ts` | CDK stack (Lambda, API Gateway, DNS) |
| `infrastructure/lib/functions/contact-form/index.ts` | Lambda handler |
| `src/lib/email/templates/contact-form.ts` | Shared templates + validation |
| `src/app/api/contact/route.ts` | Next.js API route (local dev) |
| `scripts/ops/resend-domain-manager.ts` | Domain management CLI |
| `scripts/ops/cleanup-legacy-ses-dns.sh` | Legacy DNS cleanup |
