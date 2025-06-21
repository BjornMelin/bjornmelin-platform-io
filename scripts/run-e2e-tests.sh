#!/bin/bash

# E2E Test Runner Script
# This script helps run E2E tests in Docker with various options

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
BUILD_IMAGE=true
INTERACTIVE=false
HEADED=false
SPECIFIC_TEST=""

# Help function
show_help() {
    echo "E2E Test Runner for bjornmelin-platform-io"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -n, --no-build      Skip Docker image build"
    echo "  -i, --interactive   Run in interactive mode"
    echo "  -H, --headed        Run with headed browser (requires X11)"
    echo "  -t, --test <file>   Run specific test file"
    echo "  -c, --clean         Clean up test artifacts before running"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run all E2E tests"
    echo "  $0 --no-build               # Run without rebuilding image"
    echo "  $0 --test contact-form      # Run specific test"
    echo "  $0 --headed --interactive   # Run with visible browser"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -n|--no-build)
            BUILD_IMAGE=false
            shift
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -H|--headed)
            HEADED=true
            shift
            ;;
        -t|--test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        -c|--clean)
            echo -e "${YELLOW}Cleaning test artifacts...${NC}"
            rm -rf playwright-report test-results
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Build Docker image if needed
if [ "$BUILD_IMAGE" = true ]; then
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -f Dockerfile.e2e -t e2e-tests . || {
        echo -e "${RED}Failed to build Docker image${NC}"
        exit 1
    }
fi

# Prepare Docker run command
DOCKER_CMD="docker run --rm"

# Add volume mounts for reports
DOCKER_CMD="$DOCKER_CMD -v $(pwd)/playwright-report:/app/playwright-report"
DOCKER_CMD="$DOCKER_CMD -v $(pwd)/test-results:/app/test-results"

# Add interactive mode
if [ "$INTERACTIVE" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -it"
fi

# Add headed mode (requires X11)
if [ "$HEADED" = true ]; then
    if [ -z "$DISPLAY" ]; then
        echo -e "${RED}DISPLAY variable not set. Headed mode requires X11.${NC}"
        exit 1
    fi
    DOCKER_CMD="$DOCKER_CMD -e DISPLAY=$DISPLAY"
    DOCKER_CMD="$DOCKER_CMD -v /tmp/.X11-unix:/tmp/.X11-unix"
    DOCKER_CMD="$DOCKER_CMD -e PLAYWRIGHT_HEADED=1"
fi

# Add specific test if provided
if [ -n "$SPECIFIC_TEST" ]; then
    DOCKER_CMD="$DOCKER_CMD -e PLAYWRIGHT_TEST_MATCH=$SPECIFIC_TEST"
fi

# Run the tests
echo -e "${GREEN}Running E2E tests...${NC}"
$DOCKER_CMD e2e-tests

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
    
    # Offer to open report
    if [ -f "playwright-report/index.html" ]; then
        echo -e "${YELLOW}Test report available at: playwright-report/index.html${NC}"
        read -p "Open test report in browser? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v open &> /dev/null; then
                open playwright-report/index.html
            elif command -v xdg-open &> /dev/null; then
                xdg-open playwright-report/index.html
            else
                echo "Please open playwright-report/index.html manually"
            fi
        fi
    fi
else
    echo -e "${RED}❌ Some E2E tests failed${NC}"
    echo "Check playwright-report/index.html for details"
    exit 1
fi