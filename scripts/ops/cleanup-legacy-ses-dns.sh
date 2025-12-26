#!/usr/bin/env bash
# cleanup-legacy-ses-dns.sh
#
# Identifies and removes legacy/malformed SES DNS records from Route53.
# These records include:
#   - Malformed DKIM CNAMEs with duplicate domain paths
#   - Orphaned _amazonses identity records
#
# Usage:
#   ./scripts/ops/cleanup-legacy-ses-dns.sh --hosted-zone-id Z02255141PMII3TMYOWT0 --dry-run
#   ./scripts/ops/cleanup-legacy-ses-dns.sh --hosted-zone-id Z02255141PMII3TMYOWT0
#
# Options:
#   --hosted-zone-id <id>   Route53 hosted zone ID (required)
#   --dry-run               Show what would be deleted without making changes
#   --include-amazonses     Also delete orphaned _amazonses.* TXT records
#   -h, --help              Show this help

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
  cat <<'EOF'
Usage: cleanup-legacy-ses-dns.sh [options]

Identifies and removes legacy/malformed SES DNS records from Route53.

Options:
  --hosted-zone-id <id>   Route53 hosted zone ID (required)
  --dry-run               Show what would be deleted without making changes
  --include-amazonses     Also delete orphaned _amazonses.* TXT records
  -h, --help              Show this help

Records targeted for deletion:
  1. Malformed DKIM CNAME records with duplicate domain paths like:
     xxxx._domainkey.domain.io._domainkey.domain.io.

  2. (Optional) Orphaned _amazonses.* TXT records when SES identities
     no longer exist.

Example:
  ./cleanup-legacy-ses-dns.sh --hosted-zone-id Z02255141PMII3TMYOWT0 --dry-run
EOF
}

# Parse arguments
HOSTED_ZONE_ID=""
DRY_RUN=false
INCLUDE_AMAZONSES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hosted-zone-id)
      if [[ -z "${2:-}" || "${2:-}" == --* ]]; then
        echo -e "${RED}Error: --hosted-zone-id requires a value${NC}" >&2
        show_help >&2
        exit 1
      fi
      HOSTED_ZONE_ID="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --include-amazonses)
      INCLUDE_AMAZONSES=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}" >&2
      exit 1
      ;;
  esac
done

if [[ -z "${HOSTED_ZONE_ID}" ]]; then
  echo -e "${RED}Error: --hosted-zone-id is required${NC}" >&2
  show_help >&2
  exit 1
fi

if [[ ! "${HOSTED_ZONE_ID}" =~ ^Z[A-Z0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid hosted zone ID format (should start with 'Z')${NC}" >&2
  exit 1
fi

echo -e "${YELLOW}Scanning Route53 zone ${HOSTED_ZONE_ID} for legacy SES records...${NC}"
echo ""

# Get all records from the hosted zone
ALL_RECORDS=$(aws route53 list-resource-record-sets \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --output json)

# Find malformed DKIM CNAME records (duplicate domain in path)
# Pattern: xxx._domainkey.domain.io._domainkey.domain.io. -> *.dkim.amazonses.com
# The key pattern is having _domainkey appear twice in the record name
MALFORMED_DKIM=$(echo "${ALL_RECORDS}" | jq -c '
  [.ResourceRecordSets[] |
    select(.Type == "CNAME") |
    select(.Name | test("_domainkey.*_domainkey")) |
    select(.ResourceRecords[]?.Value | test("dkim\\.amazonses\\.com"))
  ]')

MALFORMED_COUNT=$(echo "${MALFORMED_DKIM}" | jq 'length')

# Find orphaned _amazonses TXT records
AMAZONSES_RECORDS="[]"
AMAZONSES_COUNT=0
if [[ "${INCLUDE_AMAZONSES}" == "true" ]]; then
  AMAZONSES_RECORDS=$(echo "${ALL_RECORDS}" | jq -c '
    [.ResourceRecordSets[] |
      select(.Type == "TXT") |
      select(.Name | startswith("_amazonses."))
    ]')
  AMAZONSES_COUNT=$(echo "${AMAZONSES_RECORDS}" | jq 'length')
fi

# Combine all records to delete
TOTAL_COUNT=$((MALFORMED_COUNT + AMAZONSES_COUNT))

if [[ "${TOTAL_COUNT}" -eq 0 ]]; then
  echo -e "${GREEN}No legacy SES records found.${NC}"
  exit 0
fi

echo -e "Found ${YELLOW}${TOTAL_COUNT}${NC} record(s) to delete:"
echo ""

# Display malformed DKIM records
if [[ "${MALFORMED_COUNT}" -gt 0 ]]; then
  echo -e "${YELLOW}Malformed DKIM CNAME records (${MALFORMED_COUNT}):${NC}"
  echo "${MALFORMED_DKIM}" | jq -r '.[] | "  - \(.Name) -> \(.ResourceRecords[0].Value)"'
  echo ""
fi

# Display _amazonses records
if [[ "${AMAZONSES_COUNT}" -gt 0 ]]; then
  echo -e "${YELLOW}Orphaned _amazonses TXT records (${AMAZONSES_COUNT}):${NC}"
  echo "${AMAZONSES_RECORDS}" | jq -r '.[] | "  - \(.Name)"'
  echo ""
fi

# Dry run check
if [[ "${DRY_RUN}" == "true" ]]; then
  echo -e "${YELLOW}[DRY RUN]${NC} Would delete the above ${TOTAL_COUNT} record(s)."
  echo "Run without --dry-run to execute deletion."
  exit 0
fi

# Confirmation prompt
echo -e "${RED}This will permanently delete the above ${TOTAL_COUNT} record(s).${NC}"
read -p "Continue? (y/N): " -r REPLY
echo
if [[ ! "${REPLY,,}" =~ ^(y|yes)$ ]]; then
  echo "Aborted."
  exit 0
fi

# Build combined records array
RECORDS_TO_DELETE=$(jq -n \
  --argjson dkim "${MALFORMED_DKIM}" \
  --argjson ses "${AMAZONSES_RECORDS}" \
  '$dkim + $ses')

# Build change batch for deletion
CHANGE_BATCH=$(echo "${RECORDS_TO_DELETE}" | jq '{
  Changes: [.[] | {
    Action: "DELETE",
    ResourceRecordSet: {
      Name: .Name,
      Type: .Type,
      TTL: .TTL,
      ResourceRecords: .ResourceRecords
    }
  }]
}')

# Execute deletion
echo ""
echo "Deleting records..."

CHANGE_RESULT=$(aws route53 change-resource-record-sets \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --change-batch "${CHANGE_BATCH}" \
  --output json)

echo -e "${GREEN}Successfully deleted ${TOTAL_COUNT} legacy SES record(s).${NC}"
CHANGE_ID=$(echo "${CHANGE_RESULT}" | jq -r '.ChangeInfo.Id')
echo -e "Change ID: ${CHANGE_ID}"
echo -e "Check status: aws route53 get-change --id ${CHANGE_ID}"
