#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: rotate-resend-sending-key.sh [options]

Updates the SSM SecureString parameter that backs the contact form's Resend API key.

This script does NOT create or delete Resend API keys (the existing key in SSM is
typically "sending_access" and cannot manage keys). Create a new sending key in
the Resend dashboard first, then run this script to update SSM.

Options:
  --region <region>     AWS region (default: us-east-1)
  --param <name>        SSM parameter name (default: /portfolio/prod/resend/api-key)
  -h, --help            Show help

Notes:
  - Prompts for the new key via hidden input (not echoed).
  - Writes JSON metadata to the parameter (apiKey, domain, fromEmail, version, rotatedAt).
EOF
}

AWS_REGION="us-east-1"
PARAM_NAME="/portfolio/prod/resend/api-key"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      AWS_REGION="${2:-}"
      if [[ -z "${AWS_REGION}" || "${AWS_REGION}" == --* ]]; then
        echo "Error: --region requires a value" >&2
        exit 1
      fi
      shift 2
      ;;
    --param)
      PARAM_NAME="${2:-}"
      if [[ -z "${PARAM_NAME}" || "${PARAM_NAME}" == --* ]]; then
        echo "Error: --param requires a value" >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "" >&2
      show_help >&2
      exit 2
      ;;
  esac
done

read -r -s -p "Enter NEW Resend API key (will not be echoed): " NEW_API_KEY
echo
if [[ -z "${NEW_API_KEY}" ]]; then
  echo "Missing Resend API key input" >&2
  exit 1
fi

# Handle first-time creation: if parameter doesn't exist, use empty JSON
CURRENT_JSON="$(aws ssm get-parameter --name "${PARAM_NAME}" --with-decryption --region "${AWS_REGION}" --query 'Parameter.Value' --output text 2>/dev/null || echo '{}')"
CURRENT_VERSION="$(jq -r '.version // 0' <<<"${CURRENT_JSON}")"
CURRENT_DOMAIN="$(jq -r '.domain // ""' <<<"${CURRENT_JSON}")"
CURRENT_FROM_EMAIL="$(jq -r '.fromEmail // ""' <<<"${CURRENT_JSON}")"

NEW_VERSION=$((CURRENT_VERSION + 1))
NEW_ROTATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

UPDATED_JSON="$(jq -nc \
  --arg apiKey "${NEW_API_KEY}" \
  --arg domain "${CURRENT_DOMAIN}" \
  --arg fromEmail "${CURRENT_FROM_EMAIL}" \
  --arg rotatedAt "${NEW_ROTATED_AT}" \
  --argjson version "${NEW_VERSION}" \
  '{apiKey:$apiKey, domain:$domain, fromEmail:$fromEmail, version:$version, rotatedAt:$rotatedAt}')"

aws ssm put-parameter \
  --name "${PARAM_NAME}" \
  --value "${UPDATED_JSON}" \
  --type SecureString \
  --region "${AWS_REGION}" \
  --overwrite \
  --no-cli-pager >/dev/null

echo "✓ Updated ${PARAM_NAME} (region=${AWS_REGION}) to version=${NEW_VERSION} rotatedAt=${NEW_ROTATED_AT}"
