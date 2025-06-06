#!/bin/bash

set -euo pipefail

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'
readonly LOG_LEVEL="INFO"

log() {
    local level="$1"
    local message="$2"
    local color_code=""
    local symbol=""
    local filename=$(basename "$0")

    case "$level" in
        DEBUG) color_code="$CYAN"; symbol="🔍 ";;
        INFO)  color_code="$GREEN"; symbol="✅ ";;
        WARNING) color_code="$YELLOW"; symbol="⚠️ ";;
        ERROR) color_code="$RED"; symbol="❌ ";;
        *) level="INFO"; color_code="\033[0m"; symbol="✅ ";;
    esac

    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${color_code}${symbol}${message}${NC}"
}

error_exit() {
    log ERROR "$1"  
    exit 1
}

IMAGE_TAG=${1:-latest}
IMAGE_NAME="farismnrr/gizilens-backend"

log INFO "Installing libraries..."
bun install || error_exit "Failed to install libraries"
bun update || error_exit "Failed to update libraries"
log INFO "Successfully installed and upgraded libraries"

log INFO "Running Eslint..."
bun run lint:fix || error_exit "Eslint check failed"
log INFO "Successfully passed Eslint check"

# log INFO "Running newman tests..."
# if [ -d "test" ]; then
#     log INFO "Removing existing test directory..."
#     rm -rf test || error_exit "Failed to remove test directory"
# fi
# log INFO "Creating test directory..."
# mkdir -p test || error_exit "Failed to create test directory"
# cp -r ../test ./ || error_exit "Failed to copy test files"
# rm -rf test/templates || error_exit "Failed to remove old test templates"

# log INFO "Updating Postman environment file with environment variables..."
# if ! command -v jq &> /dev/null; then
#     error_exit "jq is required but not installed. Please install jq."
# fi

# if [ ! -f ".env" ]; then
#     error_exit ".env file not found. Please create it with required environment variables."
# fi

# port=$(grep -E "^PORT_BACKEND=" .env | cut -d '=' -f2 | tr -d '"' || echo "3000")
# apiKey=$(grep -E "^API_KEY=" .env | cut -d '=' -f2 | tr -d '"' || echo "")
# secretKey=$(grep -E "^MOSQUITTO_ADMIN_PASSWORD_1=" .env | cut -d '=' -f2 | tr -d '"' || echo "")

# log INFO "Loaded environment variables from .env file"

# jq --arg port "$port" \
#    --arg apiKey "$apiKey" \
#    --arg secretKey "$secretKey" \
#    '(.values[] | select(.key == "port").value) |= $port |
#     (.values[] | select(.key == "apiKey").value) |= $apiKey |
#     (.values[] | select(.key == "secretKey").value) |= $secretKey' \
#    test/GiziLens.postman_environment.json > test/GiziLens.postman_environment.tmp.json && \
#    mv test/GiziLens.postman_environment.tmp.json test/GiziLens.postman_environment.json || \
#    error_exit "Failed to update Postman environment file"

# log INFO "Successfully updated Postman environment file with environment variables"
# bun run test || error_exit "Newman tests failed"
# log INFO "Successfully passed newman tests"

log INFO "Removing libraries..."
if [ -d "node_modules" ] || [ -f "bun.lock" ]; then
    rm -rf node_modules bun.lock || error_exit "Failed to remove node_modules or bun.lock"
    log INFO "Successfully removed node_modules and bun.lock"
else
    log WARNING "node_modules or bun.lock not found, skipping removal"
fi

log INFO "Installing libraries..."
bun install --production || error_exit "Failed to install libraries"
log INFO "Successfully installed and upgraded libraries"

log INFO "Building backend..."
bun run build || error_exit "Failed to build backend"
log INFO "Successfully built backend"

log INFO "Building Docker image with tag: ${IMAGE_TAG}..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} . || error_exit "Docker build failed"
log INFO "Docker image built successfully: ${IMAGE_NAME}:${IMAGE_TAG}"

log INFO "Docker image details:"
docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "Image: {{.Repository}}:{{.Tag}}\nSize: {{.Size}}\nCreated: {{.CreatedSince}}"

log INFO "Pushing Docker image to registry..."
if docker push ${IMAGE_NAME}:${IMAGE_TAG}; then
    log INFO "Docker image pushed successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
else
    log WARNING "Failed to push Docker image. Make sure you're logged in to Docker registry with 'docker login'"
    log WARNING "You can push the image manually with: docker push ${IMAGE_NAME}:${IMAGE_TAG}"
fi