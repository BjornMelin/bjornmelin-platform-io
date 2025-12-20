#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: fix-gh-oidc-cdk-bootstrap-policy.sh --role-name <iam-role-name> [options]

Attaches an inline IAM policy to the given role so AWS CDK v2 (modern bootstrap)
can:
  - Read the bootstrap version SSM parameter (/cdk-bootstrap/<qualifier>/version)
  - Assume the CDK bootstrap roles (deploy/file/image/lookup)

Required:
  --role-name <name>       IAM role name (example: prod-portfolio-deploy)

Options:
  --region <region>        AWS region (default: us-east-1)
  --qualifier <qualifier>  CDK bootstrap qualifier (default: hnb659fds)
  --policy-name <name>     Inline policy name (default: CdkBootstrapAccess)
  --dry-run                Print the policy JSON and exit without applying

Prereqs:
  - AWS CLI configured and authenticated (e.g. `aws sso login --profile ...`)

Example:
  bash scripts/ops/fix-gh-oidc-cdk-bootstrap-policy.sh --role-name prod-portfolio-deploy
EOF
}

ROLE_NAME=""
AWS_REGION="us-east-1"
QUALIFIER="hnb659fds"
POLICY_NAME="CdkBootstrapAccess"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --role-name)
      ROLE_NAME="${2:-}"
      shift 2
      ;;
    --region)
      AWS_REGION="${2:-}"
      shift 2
      ;;
    --qualifier)
      QUALIFIER="${2:-}"
      shift 2
      ;;
    --policy-name)
      POLICY_NAME="${2:-}"
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

BOOTSTRAP_PARAM="/cdk-bootstrap/${QUALIFIER}/version"
SSM_PARAM_ARN="arn:aws:ssm:${AWS_REGION}:${ACCOUNT_ID}:parameter${BOOTSTRAP_PARAM}"

DEPLOY_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/cdk-${QUALIFIER}-deploy-role-${ACCOUNT_ID}-${AWS_REGION}"
FILE_PUB_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/cdk-${QUALIFIER}-file-publishing-role-${ACCOUNT_ID}-${AWS_REGION}"
IMAGE_PUB_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/cdk-${QUALIFIER}-image-publishing-role-${ACCOUNT_ID}-${AWS_REGION}"
LOOKUP_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/cdk-${QUALIFIER}-lookup-role-${ACCOUNT_ID}-${AWS_REGION}"

TMP_POLICY="$(mktemp)"
cleanup() { rm -f "${TMP_POLICY}"; }
trap cleanup EXIT

cat >"${TMP_POLICY}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CdkBootstrapVersionRead",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters"],
      "Resource": "${SSM_PARAM_ARN}"
    },
    {
      "Sid": "CdkAssumeBootstrapRoles",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "${DEPLOY_ROLE_ARN}",
        "${FILE_PUB_ROLE_ARN}",
        "${IMAGE_PUB_ROLE_ARN}",
        "${LOOKUP_ROLE_ARN}"
      ]
    }
  ]
}
EOF

echo "Role name:        ${ROLE_NAME}"
echo "Account:          ${ACCOUNT_ID}"
echo "Region:           ${AWS_REGION}"
echo "Qualifier:        ${QUALIFIER}"
echo "Policy name:      ${POLICY_NAME}"
echo "Bootstrap param:  ${BOOTSTRAP_PARAM}"

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
echo "  - Re-run GitHub Actions workflow: Deploy Infrastructure"
echo "  - Or verify locally:"
echo "      aws ssm get-parameter --name \"${BOOTSTRAP_PARAM}\" --region \"${AWS_REGION}\""
