#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: fix-gh-oidc-static-deploy-policy.sh --role-name <iam-role-name> [options]

Attaches an inline IAM policy to the given role so the static deploy step
(`bun run deploy:static:prod` / scripts/deploy-static-site.mjs) can:
  - Read CloudFormation exports to discover targets (cloudformation:ListExports)
  - Upload the Next.js static export to S3 (s3 sync)
  - Sync the CSP hashes CloudFront KeyValueStore (cloudfront-keyvaluestore:*)
  - Invalidate CloudFront (cloudfront:CreateInvalidation)

Required:
  --role-name <name>       IAM role name (example: prod-portfolio-deploy)

Options:
  --env <prefix>           CloudFormation export prefix (default: prod)
  --region <region>        AWS region for CloudFormation exports (default: us-east-1)
  --policy-name <name>     Inline policy name (default: StaticDeployAccess)
  --dry-run                Print the policy JSON and exit without applying

Prereqs:
  - AWS CLI configured and authenticated (e.g. `aws sso login --profile ...`)

Example:
  bash scripts/ops/fix-gh-oidc-static-deploy-policy.sh --role-name prod-portfolio-deploy --env prod
EOF
}

ROLE_NAME=""
STACK_ENV="prod"
AWS_REGION="us-east-1"
POLICY_NAME="StaticDeployAccess"
DRY_RUN="false"

require_arg() {
  local opt="$1"
  local val="${2:-}"
  if [[ -z "${val}" || "${val}" == -* ]]; then
    echo "Missing value for ${opt}" >&2
    echo "" >&2
    show_help >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --role-name)
      require_arg "$1" "${2:-}"
      ROLE_NAME="$2"
      shift 2
      ;;
    --env)
      require_arg "$1" "${2:-}"
      STACK_ENV="$2"
      shift 2
      ;;
    --region)
      require_arg "$1" "${2:-}"
      AWS_REGION="$2"
      shift 2
      ;;
    --policy-name)
      require_arg "$1" "${2:-}"
      POLICY_NAME="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
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

if [[ -z "${ROLE_NAME}" ]]; then
  echo "Missing required argument: --role-name" >&2
  echo "" >&2
  show_help >&2
  exit 2
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

bucket_name="$(aws cloudformation list-exports --region "${AWS_REGION}" --query "Exports[?Name=='${STACK_ENV}-website-bucket-name'].Value | [0]" --output text)"
distribution_id="$(aws cloudformation list-exports --region "${AWS_REGION}" --query "Exports[?Name=='${STACK_ENV}-distribution-id'].Value | [0]" --output text)"
kvs_arn="$(aws cloudformation list-exports --region "${AWS_REGION}" --query "Exports[?Name=='${STACK_ENV}-csp-hashes-kvs-arn'].Value | [0]" --output text)"

if [[ -z "${bucket_name}" || "${bucket_name}" == "None" ]]; then
  echo "Unable to resolve export: ${STACK_ENV}-website-bucket-name" >&2
  exit 1
fi
if [[ -z "${distribution_id}" || "${distribution_id}" == "None" ]]; then
  echo "Unable to resolve export: ${STACK_ENV}-distribution-id" >&2
  exit 1
fi
if [[ -z "${kvs_arn}" || "${kvs_arn}" == "None" ]]; then
  echo "Unable to resolve export: ${STACK_ENV}-csp-hashes-kvs-arn" >&2
  exit 1
fi

DIST_ARN="arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${distribution_id}"
BUCKET_ARN="arn:aws:s3:::${bucket_name}"
BUCKET_OBJECTS_ARN="arn:aws:s3:::${bucket_name}/*"

TMP_POLICY="$(mktemp)"
cleanup() { rm -f "${TMP_POLICY}"; }
trap cleanup EXIT

cat >"${TMP_POLICY}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationExportsRead",
      "Effect": "Allow",
      "Action": "cloudformation:ListExports",
      "Resource": "*"
    },
    {
      "Sid": "StaticSiteBucketList",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "${BUCKET_ARN}"
    },
    {
      "Sid": "StaticSiteBucketWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "${BUCKET_OBJECTS_ARN}"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "${DIST_ARN}"
    },
    {
      "Sid": "CloudFrontKeyValueStoreSync",
      "Effect": "Allow",
      "Action": [
        "cloudfront-keyvaluestore:DescribeKeyValueStore",
        "cloudfront-keyvaluestore:ListKeys",
        "cloudfront-keyvaluestore:UpdateKeys"
      ],
      "Resource": "${kvs_arn}"
    }
  ]
}
EOF

echo "Role name:        ${ROLE_NAME}"
echo "Account:          ${ACCOUNT_ID}"
echo "Region:           ${AWS_REGION}"
echo "Env prefix:       ${STACK_ENV}"
echo "Policy name:      ${POLICY_NAME}"
echo "Bucket:           ${bucket_name}"
echo "Distribution:     ${distribution_id}"
echo "KVS ARN:          ${kvs_arn}"

if [[ "${DRY_RUN}" == "true" ]]; then
  echo ""
  echo "Policy JSON:"
  cat "${TMP_POLICY}"
  exit 0
fi

aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "${POLICY_NAME}" \
  --policy-document "file://${TMP_POLICY}"

echo ""
echo "✓ Attached inline policy ${POLICY_NAME} to role ${ROLE_NAME}"
echo ""
echo "Next:"
echo "  - Re-run GitHub Actions workflow: Deploy Portfolio"
echo "  - Or verify locally (assume the role and run):"
echo "      aws cloudformation list-exports --region \"${AWS_REGION}\" --max-items 1"
echo "      aws s3 ls \"s3://${bucket_name}\""
echo "      aws cloudfront-keyvaluestore describe-key-value-store --kvs-arn \"${kvs_arn}\""
