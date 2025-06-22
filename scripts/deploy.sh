#!/bin/bash

# =============================================================================
# AI Agency Landing Page - Production Deployment Script
# =============================================================================
# Automated deployment script for production environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_DIR/backups"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() { log "INFO" "${BLUE}$*${NC}"; }
warn() { log "WARN" "${YELLOW}$*${NC}"; }
error() { log "ERROR" "${RED}$*${NC}"; }
success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Error handling
error_exit() {
    error "$1"
    exit 1
}

# Cleanup function
cleanup() {
    info "Cleaning up temporary files..."
    # Add cleanup commands here
}

# Trap for cleanup on exit
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."

    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. Consider using a non-root user with sudo privileges."
    fi

    # Check required commands
    local required_commands=("docker" "docker-compose" "git" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' not found. Please install it first."
        fi
    done

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running. Please start Docker first."
    fi

    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        error_exit "Environment file not found: $ENV_FILE"
    fi

    # Check docker-compose file
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        error_exit "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi

    success "Prerequisites check passed"
}

# Create necessary directories
setup_directories() {
    info "Setting up directories..."

    local dirs=("logs" "backups" "nginx/logs" "nginx/ssl")
    for dir in "${dirs[@]}"; do
        mkdir -p "$PROJECT_DIR/$dir"
    done

    success "Directories created"
}

# Backup current deployment
backup_current() {
    info "Creating backup of current deployment..."

    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$backup_path"

    # Backup environment file
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$backup_path/"
    fi

    # Backup docker-compose file
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        cp "$DOCKER_COMPOSE_FILE" "$backup_path/"
    fi

    # Export current Docker volumes
    info "Backing up Docker volumes..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli --rdb /data/backup.rdb || warn "Redis backup failed"

    # Create backup archive
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    rm -rf "$backup_path"

    success "Backup created: $backup_path.tar.gz"
}

# Pull latest code
update_code() {
    info "Updating code from repository..."

    cd "$PROJECT_DIR"

    # Stash any local changes
    git stash push -m "Auto-stash before deployment $(date)"

    # Pull latest changes
    git fetch origin
    git checkout main
    git pull origin main

    success "Code updated successfully"
}

# Build Docker images
build_images() {
    info "Building Docker images..."

    cd "$PROJECT_DIR"

    # Build with no cache for production
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache --pull

    success "Docker images built successfully"
}

# Run tests
run_tests() {
    info "Running tests..."

    cd "$PROJECT_DIR"

    # Run unit tests
    docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm app npm test -- --watchAll=false --coverage

    # Run integration tests
    docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm app npm run test:integration

    # Run security audit
    docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm app npm audit --audit-level=high

    success "All tests passed"
}

# Deploy application
deploy_application() {
    info "Deploying application..."

    cd "$PROJECT_DIR"

    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    # Start new containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

    # Wait for services to be ready
    info "Waiting for services to be ready..."
    sleep 30

    success "Application deployed successfully"
}

# Health check
health_check() {
    info "Performing health checks..."

    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            success "Health check passed"
            return 0
        fi

        info "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        ((attempt++))
    done

    error_exit "Health check failed after $max_attempts attempts"
}

# Post-deployment tasks
post_deployment() {
    info "Running post-deployment tasks..."

    # Clear application cache
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli FLUSHDB

    # Warm up application
    curl -s http://localhost:3000/ > /dev/null

    # Send deployment notification (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🚀 AI Agency Landing Page deployed successfully!"}' \
            "$SLACK_WEBHOOK_URL"
    fi

    success "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    error "Deployment failed. Starting rollback..."

    # Find latest backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -n1)

    if [[ -n "$latest_backup" ]]; then
        info "Rolling back to: $latest_backup"

        # Extract backup
        tar -xzf "$latest_backup" -C "$BACKUP_DIR"
        local backup_name=$(basename "$latest_backup" .tar.gz)

        # Restore files
        cp "$BACKUP_DIR/$backup_name/.env.production" "$ENV_FILE"
        cp "$BACKUP_DIR/$backup_name/docker-compose.prod.yml" "$DOCKER_COMPOSE_FILE"

        # Restart services
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment function
main() {
    info "Starting deployment process..."

    # Set error handling for rollback
    set +e

    check_prerequisites
    setup_directories
    backup_current
    update_code
    build_images
    run_tests
    deploy_application
    health_check
    post_deployment

    # Check if any step failed
    if [[ $? -ne 0 ]]; then
        rollback
        exit 1
    fi

    success "🎉 Deployment completed successfully!"
    info "Application is running at: http://localhost:3000"
    info "Monitoring dashboard: http://localhost:3001"
    info "Deployment log: $LOG_FILE"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -t, --test     Run tests only"
    echo "  -b, --build    Build images only"
    echo "  -d, --deploy   Deploy only (skip tests)"
    echo "  -r, --rollback Rollback to previous version"
    echo "  -v, --verbose  Enable verbose output"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -t|--test)
            run_tests
            exit 0
            ;;
        -b|--build)
            build_images
            exit 0
            ;;
        -d|--deploy)
            deploy_application
            health_check
            exit 0
            ;;
        -r|--rollback)
            rollback
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function if no arguments provided
if [[ $# -eq 0 ]]; then
    main
fi
