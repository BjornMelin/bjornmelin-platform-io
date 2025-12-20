#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# AWS SSM Parameter Setup Script
# ===========================================
# Creates the SSM parameter for contact form email delivery.
#
# Usage:
#   ./setup-aws-ssm.sh <email>
#   ./setup-aws-ssm.sh your-email@gmail.com
#
# Prerequisites:
#   - AWS CLI installed and configured
#   - Appropriate IAM permissions for SSM

show_help() {
  cat <<EOF
Usage: $(basename "$0") <email>

Creates the AWS SSM parameter for contact form email delivery.

Arguments:
  email    The email address to receive contact form submissions

Environment Variables:
  AWS_REGION    AWS region (default: us-east-1)
  PARAM_PATH    SSM parameter namespace (default: /portfolio/prod)

Examples:
  $(basename "$0") your-email@gmail.com
  AWS_REGION=us-west-2 $(basename "$0") your-email@example.com
EOF
}

# Show help if no arguments or --help
if [[ $# -eq 0 || "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
  exit 0
fi

EMAIL="${1}"
PARAM_PATH="${PARAM_PATH:-/portfolio/prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
PARAM_NAME="${PARAM_PATH}/CONTACT_EMAIL"

# Validate email format (basic check)
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  echo "Error: Invalid email format: $EMAIL" >&2
  exit 1
fi

# Check if parameter already exists and warn
if aws ssm get-parameter --name "$PARAM_NAME" --region "$AWS_REGION" &>/dev/null; then
  echo "Warning: Parameter $PARAM_NAME already exists and will be overwritten." >&2
  read -p "Continue? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted." >&2
    exit 1
  fi
fi

echo "Creating SSM parameter..."
echo "  Parameter: $PARAM_NAME"
echo "  Region:    $AWS_REGION"
echo "  Type:      SecureString"

aws ssm put-parameter \
  --name "$PARAM_NAME" \
  --value "$EMAIL" \
  --type "SecureString" \
  --region "$AWS_REGION" \
  --overwrite

echo ""
echo "✓ SSM parameter created successfully"
echo ""
echo "To verify:"
echo "  aws ssm get-parameter --name \"$PARAM_NAME\" --with-decryption --region $AWS_REGION"
