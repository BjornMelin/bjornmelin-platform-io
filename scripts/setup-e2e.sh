#!/bin/bash

# E2E Setup Script
# Quick setup for E2E testing environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up E2E testing environment...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Please start Docker Desktop or the Docker daemon"
    exit 1
fi

echo -e "${GREEN}✅ Docker daemon running${NC}"

# Create directories for test artifacts
echo -e "${YELLOW}Creating test directories...${NC}"
mkdir -p playwright-report test-results

# Build the E2E Docker image
echo -e "${YELLOW}Building E2E test image...${NC}"
docker build -f Dockerfile.e2e -t e2e-tests . || {
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
}

echo -e "${GREEN}✅ E2E test image built successfully${NC}"

# Pull Playwright image to ensure it's cached
echo -e "${YELLOW}Pulling Playwright base image...${NC}"
docker pull mcr.microsoft.com/playwright:v1.53.1-focal

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "You can now run E2E tests with:"
echo "  ./scripts/run-e2e-tests.sh"
echo ""
echo "Or use Docker directly:"
echo "  docker run --rm e2e-tests"
echo ""
echo "For more options, run:"
echo "  ./scripts/run-e2e-tests.sh --help"