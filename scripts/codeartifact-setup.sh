#!/bin/bash

# CodeArtifact Setup Script
# This script helps set up and manage CodeArtifact integration

set -euo pipefail

# Configuration
DOMAIN_NAME="${CODEARTIFACT_DOMAIN:-bjornmelin-platform}"
REPOSITORY_NAME="${CODEARTIFACT_REPOSITORY:-platform-releases}"
AWS_REGION="${AWS_REGION:-us-east-1}"
GITHUB_REPO="${GITHUB_REPOSITORY:-bjornmelin/bjornmelin-platform-io}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    local deps=("aws" "jq" "npm" "node")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            print_error "$dep is not installed"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    
    print_success "All dependencies satisfied"
}

create_domain() {
    print_header "Creating CodeArtifact Domain"
    
    if aws codeartifact describe-domain --domain "$DOMAIN_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Domain '$DOMAIN_NAME' already exists"
    else
        aws codeartifact create-domain \
            --domain "$DOMAIN_NAME" \
            --region "$AWS_REGION" \
            --tags "Project=bjornmelin-platform" "ManagedBy=Script"
        
        print_success "Domain '$DOMAIN_NAME' created"
    fi
}

create_repository() {
    print_header "Creating CodeArtifact Repository"
    
    if aws codeartifact describe-repository \
        --domain "$DOMAIN_NAME" \
        --repository "$REPOSITORY_NAME" \
        --region "$AWS_REGION" &> /dev/null; then
        print_warning "Repository '$REPOSITORY_NAME' already exists"
    else
        aws codeartifact create-repository \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --description "Repository for platform npm releases" \
            --region "$AWS_REGION" \
            --tags "Project=bjornmelin-platform" "ManagedBy=Script"
        
        # Add external connection to npmjs
        aws codeartifact associate-external-connection \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --external-connection "public:npmjs" \
            --region "$AWS_REGION"
        
        print_success "Repository '$REPOSITORY_NAME' created with npmjs upstream"
    fi
}

setup_oidc_provider() {
    print_header "Setting up GitHub OIDC Provider"
    
    local provider_arn="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):oidc-provider/token.actions.githubusercontent.com"
    
    if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$provider_arn" &> /dev/null; then
        print_warning "GitHub OIDC provider already exists"
    else
        aws iam create-open-id-connect-provider \
            --url https://token.actions.githubusercontent.com \
            --client-id-list sts.amazonaws.com \
            --thumbprint-list \
                6938fd4d98bab03faadb97b34396831e3780aea1 \
                1c58a3a8518e8759bf075b76b750d4f2df264fcd
        
        print_success "GitHub OIDC provider created"
    fi
}

create_iam_role() {
    print_header "Creating IAM Role for GitHub Actions"
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local role_name="GitHubActionsCodeArtifact"
    
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::${account_id}:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                    "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:ref:refs/heads/main"
                }
            }
        }
    ]
}
EOF

    # Create permissions policy
    cat > /tmp/permissions-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "codeartifact:GetAuthorizationToken",
                "codeartifact:GetRepositoryEndpoint",
                "codeartifact:ReadFromRepository"
            ],
            "Resource": [
                "arn:aws:codeartifact:${AWS_REGION}:${account_id}:domain/${DOMAIN_NAME}",
                "arn:aws:codeartifact:${AWS_REGION}:${account_id}:repository/${DOMAIN_NAME}/${REPOSITORY_NAME}"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "codeartifact:PublishPackageVersion",
                "codeartifact:PutPackageMetadata",
                "codeartifact:DescribePackageVersion",
                "codeartifact:ListPackageVersions"
            ],
            "Resource": [
                "arn:aws:codeartifact:${AWS_REGION}:${account_id}:package/${DOMAIN_NAME}/${REPOSITORY_NAME}/*/*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "sts:GetServiceBearerToken",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "sts:AWSServiceName": "codeartifact.amazonaws.com"
                }
            }
        }
    ]
}
EOF

    # Create or update role
    if aws iam get-role --role-name "$role_name" &> /dev/null; then
        print_warning "Role '$role_name' already exists, updating policies"
        aws iam update-assume-role-policy \
            --role-name "$role_name" \
            --policy-document file:///tmp/trust-policy.json
    else
        aws iam create-role \
            --role-name "$role_name" \
            --assume-role-policy-document file:///tmp/trust-policy.json \
            --description "Role for GitHub Actions to publish to CodeArtifact" \
            --tags "Key=Project,Value=bjornmelin-platform" "Key=ManagedBy,Value=Script"
    fi
    
    # Attach inline policy
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "CodeArtifactPublishPolicy" \
        --policy-document file:///tmp/permissions-policy.json
    
    # Clean up temp files
    rm -f /tmp/trust-policy.json /tmp/permissions-policy.json
    
    print_success "IAM role '$role_name' configured"
    echo "Role ARN: arn:aws:iam::${account_id}:role/${role_name}"
}

configure_local_npm() {
    print_header "Configuring Local NPM for CodeArtifact"
    
    # Get auth token
    local auth_token=$(aws codeartifact get-authorization-token \
        --domain "$DOMAIN_NAME" \
        --region "$AWS_REGION" \
        --query authorizationToken \
        --output text)
    
    # Get repository endpoint
    local repo_endpoint=$(aws codeartifact get-repository-endpoint \
        --domain "$DOMAIN_NAME" \
        --repository "$REPOSITORY_NAME" \
        --format npm \
        --region "$AWS_REGION" \
        --query repositoryEndpoint \
        --output text)
    
    # Configure npm
    npm config set registry "$repo_endpoint"
    npm config set "${repo_endpoint/https:\/\//}//:_authToken" "$auth_token"
    
    print_success "NPM configured for CodeArtifact"
    echo "Registry: $repo_endpoint"
}

test_publish() {
    print_header "Testing Package Publishing"
    
    # Create a test package
    local test_dir="/tmp/codeartifact-test-$$"
    mkdir -p "$test_dir"
    cd "$test_dir"
    
    cat > package.json <<EOF
{
    "name": "@bjornmelin/test-package",
    "version": "0.0.1",
    "description": "Test package for CodeArtifact",
    "main": "index.js",
    "private": false
}
EOF

    echo "console.log('Test package');" > index.js
    
    # Try to publish
    if npm publish --access public; then
        print_success "Test package published successfully"
        
        # Clean up test package
        aws codeartifact delete-package-versions \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --format npm \
            --package "@bjornmelin/test-package" \
            --versions "0.0.1" \
            --region "$AWS_REGION" &> /dev/null
    else
        print_error "Failed to publish test package"
    fi
    
    # Clean up
    cd - > /dev/null
    rm -rf "$test_dir"
}

show_github_config() {
    print_header "GitHub Actions Configuration"
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    
    echo "Add the following secret to your GitHub repository:"
    echo -e "${YELLOW}AWS_ACCOUNT_ID${NC}: $account_id"
    echo
    echo "The workflow is configured to use:"
    echo "- Region: $AWS_REGION"
    echo "- Domain: $DOMAIN_NAME"
    echo "- Repository: $REPOSITORY_NAME"
    echo "- Role: arn:aws:iam::${account_id}:role/GitHubActionsCodeArtifact"
}

# Main execution
main() {
    case "${1:-setup}" in
        setup)
            check_dependencies
            create_domain
            create_repository
            setup_oidc_provider
            create_iam_role
            show_github_config
            ;;
        configure-npm)
            configure_local_npm
            ;;
        test)
            configure_local_npm
            test_publish
            ;;
        info)
            show_github_config
            ;;
        *)
            echo "Usage: $0 {setup|configure-npm|test|info}"
            echo
            echo "Commands:"
            echo "  setup         - Create all AWS resources"
            echo "  configure-npm - Configure local npm for CodeArtifact"
            echo "  test          - Test publishing to CodeArtifact"
            echo "  info          - Show GitHub configuration info"
            exit 1
            ;;
    esac
}

main "$@"