#!/bin/bash

# CodeArtifact Recovery Script
# This script helps recover packages from CodeArtifact

set -euo pipefail

# Configuration
DOMAIN_NAME="${CODEARTIFACT_DOMAIN:-bjornmelin-platform}"
REPOSITORY_NAME="${CODEARTIFACT_REPOSITORY:-platform-releases}"
AWS_REGION="${AWS_REGION:-us-east-1}"
PACKAGE_NAME="${PACKAGE_NAME:-bjornmelin-platform-io}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

check_dependencies() {
    local deps=("aws" "jq" "npm")
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
}

list_versions() {
    print_header "Available Package Versions"
    
    aws codeartifact list-package-versions \
        --domain "$DOMAIN_NAME" \
        --repository "$REPOSITORY_NAME" \
        --format npm \
        --package "$PACKAGE_NAME" \
        --region "$AWS_REGION" \
        --output table \
        --query 'versions[].{Version:version,Status:status,Revision:revision}'
}

download_package() {
    local version="${1:-latest}"
    print_header "Downloading Package"
    
    # Configure npm for CodeArtifact
    local auth_token=$(aws codeartifact get-authorization-token \
        --domain "$DOMAIN_NAME" \
        --region "$AWS_REGION" \
        --query authorizationToken \
        --output text)
    
    local repo_endpoint=$(aws codeartifact get-repository-endpoint \
        --domain "$DOMAIN_NAME" \
        --repository "$REPOSITORY_NAME" \
        --format npm \
        --region "$AWS_REGION" \
        --query repositoryEndpoint \
        --output text)
    
    # Create temporary .npmrc
    cat > .npmrc.tmp <<EOF
registry=$repo_endpoint
${repo_endpoint/https:\/\//}//:_authToken=$auth_token
EOF
    
    # Download the package
    if [ "$version" = "latest" ]; then
        print_info "Downloading latest version of $PACKAGE_NAME"
        npm pack "$PACKAGE_NAME" --userconfig=.npmrc.tmp
    else
        print_info "Downloading $PACKAGE_NAME@$version"
        npm pack "$PACKAGE_NAME@$version" --userconfig=.npmrc.tmp
    fi
    
    # Clean up
    rm -f .npmrc.tmp
    
    local tarball=$(ls -1t *.tgz | head -n1)
    if [ -n "$tarball" ]; then
        print_success "Package downloaded: $tarball"
    else
        print_error "Failed to download package"
        return 1
    fi
}

restore_to_npm() {
    local version="${1:-all}"
    print_header "Restoring to NPM Registry"
    
    # Check if npm token is available
    if [ -z "${NPM_TOKEN:-}" ]; then
        print_error "NPM_TOKEN environment variable not set"
        print_info "Please set NPM_TOKEN with your npm authentication token"
        return 1
    fi
    
    # Configure npm for CodeArtifact
    local auth_token=$(aws codeartifact get-authorization-token \
        --domain "$DOMAIN_NAME" \
        --region "$AWS_REGION" \
        --query authorizationToken \
        --output text)
    
    local repo_endpoint=$(aws codeartifact get-repository-endpoint \
        --domain "$DOMAIN_NAME" \
        --repository "$REPOSITORY_NAME" \
        --format npm \
        --region "$AWS_REGION" \
        --query repositoryEndpoint \
        --output text)
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Configure npm for CodeArtifact download
    cat > .npmrc <<EOF
@bjornmelin:registry=$repo_endpoint
${repo_endpoint/https:\/\//}//:_authToken=$auth_token
EOF
    
    if [ "$version" = "all" ]; then
        # Get all versions
        local versions=$(aws codeartifact list-package-versions \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --format npm \
            --package "$PACKAGE_NAME" \
            --region "$AWS_REGION" \
            --query 'versions[?status==`Published`].version' \
            --output text)
        
        for ver in $versions; do
            print_info "Restoring version $ver"
            
            # Download from CodeArtifact
            npm pack "$PACKAGE_NAME@$ver"
            
            # Configure npm for npmjs registry
            cat > .npmrc <<EOF
//registry.npmjs.org/:_authToken=$NPM_TOKEN
registry=https://registry.npmjs.org/
EOF
            
            # Publish to npmjs
            local tarball=$(ls -1 "${PACKAGE_NAME}-${ver}.tgz" 2>/dev/null || ls -1 *.tgz | grep "$ver")
            if [ -n "$tarball" ] && [ -f "$tarball" ]; then
                if npm publish "$tarball" --access public; then
                    print_success "Version $ver restored to npm"
                else
                    print_warning "Failed to publish version $ver (may already exist)"
                fi
                rm -f "$tarball"
            fi
            
            # Reconfigure for CodeArtifact for next download
            cat > .npmrc <<EOF
@bjornmelin:registry=$repo_endpoint
${repo_endpoint/https:\/\//}//:_authToken=$auth_token
EOF
        done
    else
        # Restore specific version
        print_info "Restoring version $version"
        
        # Download from CodeArtifact
        npm pack "$PACKAGE_NAME@$version"
        
        # Configure npm for npmjs registry
        cat > .npmrc <<EOF
//registry.npmjs.org/:_authToken=$NPM_TOKEN
registry=https://registry.npmjs.org/
EOF
        
        # Publish to npmjs
        local tarball=$(ls -1 *.tgz | head -n1)
        if [ -n "$tarball" ] && [ -f "$tarball" ]; then
            if npm publish "$tarball" --access public; then
                print_success "Version $version restored to npm"
            else
                print_warning "Failed to publish version $version (may already exist)"
            fi
        fi
    fi
    
    # Clean up
    cd - > /dev/null
    rm -rf "$temp_dir"
}

backup_all_metadata() {
    print_header "Backing Up Package Metadata"
    
    local backup_dir="codeartifact-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Get all versions with metadata
    print_info "Fetching package metadata..."
    
    aws codeartifact list-package-versions \
        --domain "$DOMAIN_NAME" \
        --repository "$REPOSITORY_NAME" \
        --format npm \
        --package "$PACKAGE_NAME" \
        --region "$AWS_REGION" \
        --output json > "$backup_dir/versions.json"
    
    # Get package information
    local versions=$(jq -r '.versions[].version' "$backup_dir/versions.json")
    
    for version in $versions; do
        print_info "Backing up metadata for version $version"
        
        aws codeartifact describe-package-version \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --format npm \
            --package "$PACKAGE_NAME" \
            --package-version "$version" \
            --region "$AWS_REGION" \
            --output json > "$backup_dir/version-$version.json"
    done
    
    # Create summary
    cat > "$backup_dir/summary.txt" <<EOF
CodeArtifact Backup Summary
==========================
Date: $(date)
Domain: $DOMAIN_NAME
Repository: $REPOSITORY_NAME
Package: $PACKAGE_NAME
Region: $AWS_REGION

Total Versions: $(echo "$versions" | wc -w)
Versions: $(echo "$versions" | tr '\n' ' ')
EOF
    
    print_success "Metadata backed up to: $backup_dir"
}

show_package_info() {
    local version="${1:-}"
    print_header "Package Information"
    
    if [ -z "$version" ]; then
        # Show general package info
        aws codeartifact describe-package \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --format npm \
            --package "$PACKAGE_NAME" \
            --region "$AWS_REGION" \
            --output json | jq '.'
    else
        # Show specific version info
        aws codeartifact describe-package-version \
            --domain "$DOMAIN_NAME" \
            --repository "$REPOSITORY_NAME" \
            --format npm \
            --package "$PACKAGE_NAME" \
            --package-version "$version" \
            --region "$AWS_REGION" \
            --output json | jq '.'
    fi
}

# Main execution
main() {
    case "${1:-list}" in
        list)
            check_dependencies
            list_versions
            ;;
        download)
            check_dependencies
            download_package "${2:-latest}"
            ;;
        restore)
            check_dependencies
            restore_to_npm "${2:-all}"
            ;;
        backup)
            check_dependencies
            backup_all_metadata
            ;;
        info)
            check_dependencies
            show_package_info "${2:-}"
            ;;
        *)
            echo "Usage: $0 {list|download|restore|backup|info} [version]"
            echo
            echo "Commands:"
            echo "  list              - List all available package versions"
            echo "  download [version] - Download a specific version (default: latest)"
            echo "  restore [version]  - Restore version(s) to npm registry (default: all)"
            echo "  backup            - Backup all package metadata"
            echo "  info [version]    - Show package information"
            echo
            echo "Environment variables:"
            echo "  CODEARTIFACT_DOMAIN    - CodeArtifact domain (default: bjornmelin-platform)"
            echo "  CODEARTIFACT_REPOSITORY - CodeArtifact repository (default: platform-releases)"
            echo "  AWS_REGION             - AWS region (default: us-east-1)"
            echo "  PACKAGE_NAME           - Package name (default: bjornmelin-platform-io)"
            echo "  NPM_TOKEN              - NPM auth token (required for restore)"
            exit 1
            ;;
    esac
}

main "$@"