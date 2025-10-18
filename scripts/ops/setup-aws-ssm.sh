#!/usr/bin/env bash
set -euo pipefail

# Preconditions:
# - AWS CLI installed and configured with appropriate account/role
# - Region provided via AWS_REGION env or default profile

# Example usage:
#   PARAM_PATH=/myapp/prod \
#   aws ssm put-parameter --name "$PARAM_PATH/RESEND_API_KEY" --type SecureString --value "xxxx" --overwrite

PARAM_PATH=${PARAM_PATH:-"/portfolio/prod"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

echo "SSM Parameter namespace: ${PARAM_PATH} (${AWS_REGION})"

# Add any back-end secrets here (examples commented):
# aws ssm put-parameter --region "$AWS_REGION" --name "$PARAM_PATH/RESEND_API_KEY" --type SecureString --value "$RESEND_API_KEY" --overwrite
# aws ssm put-parameter --region "$AWS_REGION" --name "$PARAM_PATH/CONTACT_EMAIL" --type String --value "$CONTACT_EMAIL" --overwrite

echo "No parameters written (script is a scaffold). Export vars and uncomment commands above to apply."

