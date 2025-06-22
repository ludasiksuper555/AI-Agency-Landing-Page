#!/bin/bash

# =============================================================================
# AI Agency Landing Page - Backup and Restore Script
# =============================================================================
# Automated backup and restore script for data protection and disaster recovery

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
LOGS_DIR="$PROJECT_DIR/logs"
TEMP_DIR="/tmp/ai-agency-backup"

# Backup configuration
BACKUP_RETENTION_DAYS=30
DAILY_BACKUP_RETENTION=7
WEEKLY_BACKUP_RETENTION=4
MONTHLY_BACKUP_RETENTION=12
MAX_BACKUP_SIZE="10G"

# Database configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-ai_agency}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-ai_agency}"
MONGO_USER="${MONGO_USER:-}"
MONGO_PASSWORD="${MONGO_PASSWORD:-}"

# Cloud storage configuration
AWS_S3_BUCKET="${AWS_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"
GCP_BUCKET="${GCP_BUCKET:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"

# Encryption configuration
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
ENCRYPTION_ALGORITHM="aes-256-cbc"

# Notification configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOGS_DIR/backup.log"
}

info() { log "INFO" "${BLUE}ℹ️  $*${NC}"; }
warn() { log "WARN" "${YELLOW}⚠️  $*${NC}"; }
error() { log "ERROR" "${RED}❌ $*${NC}"; }
success() { log "SUCCESS" "${GREEN}✅ $*${NC}"; }
step() { log "STEP" "${PURPLE}🔧 $*${NC}"; }
backup_info() { log "BACKUP" "${CYAN}💾 $*${NC}"; }

# Error handling
error_exit() {
    error "$1"
    cleanup
    exit 1
}

# Cleanup function
cleanup() {
    info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}

# Trap for cleanup on exit
trap cleanup EXIT

# Setup backup environment
setup_backup_env() {
    step "Setting up backup environment..."

    # Create directories
    mkdir -p "$BACKUP_DIR" "$LOGS_DIR" "$TEMP_DIR"

    # Create backup structure
    local backup_dirs=(
        "$BACKUP_DIR/daily"
        "$BACKUP_DIR/weekly"
        "$BACKUP_DIR/monthly"
        "$BACKUP_DIR/manual"
    )

    for dir in "${backup_dirs[@]}"; do
        mkdir -p "$dir"
    done

    success "Backup environment setup completed"
}

# Check prerequisites
check_prerequisites() {
    step "Checking prerequisites..."

    # Check required commands
    local required_commands=("tar" "gzip" "date")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error_exit "Required command '$cmd' not found"
        fi
    done

    # Check encryption tools if encryption is enabled
    if [[ -n "$ENCRYPTION_KEY" ]]; then
        if ! command -v openssl >/dev/null 2>&1; then
            error_exit "OpenSSL not found but encryption is enabled"
        fi
    fi

    # Check cloud storage tools
    if [[ -n "$AWS_S3_BUCKET" ]] && ! command -v aws >/dev/null 2>&1; then
        warn "AWS CLI not found, S3 backup will be skipped"
    fi

    if [[ -n "$GCP_BUCKET" ]] && ! command -v gsutil >/dev/null 2>&1; then
        warn "Google Cloud SDK not found, GCS backup will be skipped"
    fi

    if [[ -n "$AZURE_CONTAINER" ]] && ! command -v az >/dev/null 2>&1; then
        warn "Azure CLI not found, Azure backup will be skipped"
    fi

    success "Prerequisites check completed"
}

# Create backup manifest
create_manifest() {
    local backup_path="$1"
    local manifest_file="$backup_path/manifest.json"

    backup_info "Creating backup manifest..."

    cat > "$manifest_file" << EOF
{
  "backup_info": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "1.0",
    "type": "${BACKUP_TYPE:-full}",
    "hostname": "$(hostname)",
    "project": "AI Agency Landing Page",
    "created_by": "backup.sh"
  },
  "system_info": {
    "os": "$(uname -s)",
    "architecture": "$(uname -m)",
    "kernel": "$(uname -r)"
  },
  "backup_contents": {
    "application_files": true,
    "configuration_files": true,
    "environment_files": true,
    "logs": true,
    "databases": {
      "redis": $([ -n "$REDIS_HOST" ] && echo "true" || echo "false"),
      "postgres": $([ -n "$POSTGRES_HOST" ] && echo "true" || echo "false"),
      "mongodb": $([ -n "$MONGO_HOST" ] && echo "true" || echo "false")
    }
  },
  "encryption": {
    "enabled": $([ -n "$ENCRYPTION_KEY" ] && echo "true" || echo "false"),
    "algorithm": "$ENCRYPTION_ALGORITHM"
  }
}
EOF

    success "Backup manifest created"
}

# Backup application files
backup_application() {
    local backup_path="$1"

    backup_info "Backing up application files..."

    cd "$PROJECT_DIR"

    # Create list of files to backup
    local include_patterns=(
        "src/"
        "public/"
        "pages/"
        "components/"
        "lib/"
        "utils/"
        "styles/"
        "types/"
        "hooks/"
        "context/"
        "middleware/"
        "package.json"
        "package-lock.json"
        "yarn.lock"
        "pnpm-lock.yaml"
        "next.config.js"
        "next.config.mjs"
        "tailwind.config.js"
        "tsconfig.json"
        "eslint.config.js"
        ".eslintrc*"
        "prettier.config.js"
        ".prettierrc*"
        "postcss.config.js"
        "README.md"
        "CHANGELOG.md"
        "LICENSE"
        "Dockerfile"
        "docker-compose*.yml"
        ".dockerignore"
        ".gitignore"
        ".editorconfig"
        ".nvmrc"
    )

    local exclude_patterns=(
        "node_modules/"
        ".next/"
        "out/"
        "dist/"
        "build/"
        "coverage/"
        "reports/"
        "logs/"
        "backups/"
        "tmp/"
        "temp/"
        ".git/"
        "*.log"
        "*.tmp"
        ".DS_Store"
        "Thumbs.db"
        "*.env.local"
        "*.env.production"
    )

    # Build tar command
    local tar_cmd="tar -czf \"$backup_path/application.tar.gz\""

    # Add exclude patterns
    for pattern in "${exclude_patterns[@]}"; do
        tar_cmd+=" --exclude=\"$pattern\""
    done

    # Add include patterns
    for pattern in "${include_patterns[@]}"; do
        if [[ -e "$pattern" ]]; then
            tar_cmd+=" \"$pattern\""
        fi
    done

    # Execute tar command
    eval "$tar_cmd" || error_exit "Failed to backup application files"

    local file_size
    file_size=$(du -h "$backup_path/application.tar.gz" | cut -f1)
    success "Application files backed up ($file_size)"
}

# Backup configuration files
backup_configuration() {
    local backup_path="$1"

    backup_info "Backing up configuration files..."

    cd "$PROJECT_DIR"

    # Configuration files to backup
    local config_files=(
        ".env.example"
        "nginx/nginx.conf"
        "prometheus/prometheus.yml"
        "grafana/datasources.yml"
        "grafana/dashboards/"
        "scripts/"
        "docs/"
    )

    local config_backup_dir="$backup_path/configuration"
    mkdir -p "$config_backup_dir"

    for config in "${config_files[@]}"; do
        if [[ -e "$config" ]]; then
            if [[ -d "$config" ]]; then
                cp -r "$config" "$config_backup_dir/"
            else
                cp "$config" "$config_backup_dir/"
            fi
        fi
    done

    # Create configuration archive
    tar -czf "$backup_path/configuration.tar.gz" -C "$backup_path" configuration/
    rm -rf "$config_backup_dir"

    local file_size
    file_size=$(du -h "$backup_path/configuration.tar.gz" | cut -f1)
    success "Configuration files backed up ($file_size)"
}

# Backup environment files (sanitized)
backup_environment() {
    local backup_path="$1"

    backup_info "Backing up environment files (sanitized)..."

    cd "$PROJECT_DIR"

    local env_backup_dir="$backup_path/environment"
    mkdir -p "$env_backup_dir"

    # Backup environment files with sensitive data removed
    local env_files=(".env.local" ".env.production" ".env.staging" ".env.development")

    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            # Create sanitized version
            local sanitized_file="$env_backup_dir/$(basename "$env_file").sanitized"

            # Remove sensitive values but keep structure
            sed -E 's/(.*=).*/\1[REDACTED]/' "$env_file" > "$sanitized_file"
        fi
    done

    # Create environment archive
    if [[ -d "$env_backup_dir" ]] && [[ -n "$(ls -A "$env_backup_dir")" ]]; then
        tar -czf "$backup_path/environment.tar.gz" -C "$backup_path" environment/
        rm -rf "$env_backup_dir"

        local file_size
        file_size=$(du -h "$backup_path/environment.tar.gz" | cut -f1)
        success "Environment files backed up (sanitized, $file_size)"
    else
        warn "No environment files found to backup"
    fi
}

# Backup Redis database
backup_redis() {
    local backup_path="$1"

    if [[ -z "$REDIS_HOST" ]]; then
        warn "Redis host not configured, skipping Redis backup"
        return 0
    fi

    backup_info "Backing up Redis database..."

    if ! command -v redis-cli >/dev/null 2>&1; then
        warn "Redis CLI not found, skipping Redis backup"
        return 0
    fi

    # Test Redis connection
    local redis_cmd="redis-cli -h \"$REDIS_HOST\" -p \"$REDIS_PORT\""
    if [[ -n "$REDIS_PASSWORD" ]]; then
        redis_cmd+=" -a \"$REDIS_PASSWORD\""
    fi

    if ! eval "$redis_cmd ping" | grep -q "PONG"; then
        error "Cannot connect to Redis at $REDIS_HOST:$REDIS_PORT"
        return 1
    fi

    # Create Redis backup
    eval "$redis_cmd --rdb \"$backup_path/redis.rdb\"" || {
        error "Failed to backup Redis database"
        return 1
    }

    # Compress Redis backup
    gzip "$backup_path/redis.rdb"

    local file_size
    file_size=$(du -h "$backup_path/redis.rdb.gz" | cut -f1)
    success "Redis database backed up ($file_size)"
}

# Backup PostgreSQL database
backup_postgres() {
    local backup_path="$1"

    if [[ -z "$POSTGRES_HOST" ]]; then
        warn "PostgreSQL host not configured, skipping PostgreSQL backup"
        return 0
    fi

    backup_info "Backing up PostgreSQL database..."

    if ! command -v pg_dump >/dev/null 2>&1; then
        warn "pg_dump not found, skipping PostgreSQL backup"
        return 0
    fi

    # Set PostgreSQL environment variables
    export PGHOST="$POSTGRES_HOST"
    export PGPORT="$POSTGRES_PORT"
    export PGUSER="$POSTGRES_USER"
    export PGPASSWORD="$POSTGRES_PASSWORD"

    # Create PostgreSQL backup
    pg_dump --verbose --clean --no-owner --no-privileges "$POSTGRES_DB" > "$backup_path/postgres.sql" || {
        error "Failed to backup PostgreSQL database"
        return 1
    }

    # Compress PostgreSQL backup
    gzip "$backup_path/postgres.sql"

    local file_size
    file_size=$(du -h "$backup_path/postgres.sql.gz" | cut -f1)
    success "PostgreSQL database backed up ($file_size)"
}

# Backup MongoDB database
backup_mongodb() {
    local backup_path="$1"

    if [[ -z "$MONGO_HOST" ]]; then
        warn "MongoDB host not configured, skipping MongoDB backup"
        return 0
    fi

    backup_info "Backing up MongoDB database..."

    if ! command -v mongodump >/dev/null 2>&1; then
        warn "mongodump not found, skipping MongoDB backup"
        return 0
    fi

    # Build mongodump command
    local mongo_cmd="mongodump --host \"$MONGO_HOST:$MONGO_PORT\" --db \"$MONGO_DB\" --out \"$backup_path/mongodb\""

    if [[ -n "$MONGO_USER" ]] && [[ -n "$MONGO_PASSWORD" ]]; then
        mongo_cmd+=" --username \"$MONGO_USER\" --password \"$MONGO_PASSWORD\""
    fi

    # Create MongoDB backup
    eval "$mongo_cmd" || {
        error "Failed to backup MongoDB database"
        return 1
    }

    # Compress MongoDB backup
    tar -czf "$backup_path/mongodb.tar.gz" -C "$backup_path" mongodb/
    rm -rf "$backup_path/mongodb"

    local file_size
    file_size=$(du -h "$backup_path/mongodb.tar.gz" | cut -f1)
    success "MongoDB database backed up ($file_size)"
}

# Backup logs
backup_logs() {
    local backup_path="$1"

    backup_info "Backing up logs..."

    if [[ -d "$LOGS_DIR" ]] && [[ -n "$(ls -A "$LOGS_DIR" 2>/dev/null)" ]]; then
        # Only backup recent logs (last 7 days)
        find "$LOGS_DIR" -name "*.log" -mtime -7 -exec tar -czf "$backup_path/logs.tar.gz" {} + || {
            warn "Failed to backup logs"
            return 1
        }

        local file_size
        file_size=$(du -h "$backup_path/logs.tar.gz" | cut -f1)
        success "Logs backed up ($file_size)"
    else
        warn "No logs found to backup"
    fi
}

# Encrypt backup
encrypt_backup() {
    local backup_path="$1"

    if [[ -z "$ENCRYPTION_KEY" ]]; then
        info "Encryption not enabled, skipping encryption"
        return 0
    fi

    backup_info "Encrypting backup..."

    # Create encrypted archive
    local encrypted_file="$backup_path.encrypted.tar.gz"

    tar -czf - -C "$(dirname "$backup_path")" "$(basename "$backup_path")" | \
        openssl enc -"$ENCRYPTION_ALGORITHM" -salt -k "$ENCRYPTION_KEY" -out "$encrypted_file" || {
        error "Failed to encrypt backup"
        return 1
    }

    # Remove unencrypted backup
    rm -rf "$backup_path"

    local file_size
    file_size=$(du -h "$encrypted_file" | cut -f1)
    success "Backup encrypted ($file_size)"
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    local backup_name="$(basename "$backup_file")"

    backup_info "Uploading backup to cloud storage..."

    # Upload to AWS S3
    if [[ -n "$AWS_S3_BUCKET" ]] && command -v aws >/dev/null 2>&1; then
        info "Uploading to AWS S3..."
        aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/$backup_name" --region "$AWS_REGION" || {
            warn "Failed to upload to AWS S3"
        }
    fi

    # Upload to Google Cloud Storage
    if [[ -n "$GCP_BUCKET" ]] && command -v gsutil >/dev/null 2>&1; then
        info "Uploading to Google Cloud Storage..."
        gsutil cp "$backup_file" "gs://$GCP_BUCKET/backups/$backup_name" || {
            warn "Failed to upload to Google Cloud Storage"
        }
    fi

    # Upload to Azure Blob Storage
    if [[ -n "$AZURE_CONTAINER" ]] && command -v az >/dev/null 2>&1; then
        info "Uploading to Azure Blob Storage..."
        az storage blob upload --file "$backup_file" --name "backups/$backup_name" --container-name "$AZURE_CONTAINER" || {
            warn "Failed to upload to Azure Blob Storage"
        }
    fi

    success "Cloud upload completed"
}

# Clean old backups
clean_old_backups() {
    step "Cleaning old backups..."

    # Clean daily backups
    find "$BACKUP_DIR/daily" -name "*.tar.gz" -mtime +$DAILY_BACKUP_RETENTION -delete 2>/dev/null || true

    # Clean weekly backups
    find "$BACKUP_DIR/weekly" -name "*.tar.gz" -mtime +$((WEEKLY_BACKUP_RETENTION * 7)) -delete 2>/dev/null || true

    # Clean monthly backups
    find "$BACKUP_DIR/monthly" -name "*.tar.gz" -mtime +$((MONTHLY_BACKUP_RETENTION * 30)) -delete 2>/dev/null || true

    # Clean general backups
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true

    success "Old backups cleaned"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    local backup_file="$3"

    local file_size=""
    if [[ -f "$backup_file" ]]; then
        file_size=$(du -h "$backup_file" | cut -f1)
    fi

    # Send Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji
        case $status in
            "success") emoji="✅" ;;
            "warning") emoji="⚠️" ;;
            "error") emoji="❌" ;;
            *) emoji="ℹ️" ;;
        esac

        local slack_message="$emoji *Backup $status*\n$message"
        if [[ -n "$file_size" ]]; then
            slack_message+="\n📦 Size: $file_size"
        fi
        slack_message+="\n🕐 Time: $(date)"

        local slack_payload
        slack_payload=$(jq -n --arg text "$slack_message" '{text: $text}')
        curl -X POST -H 'Content-type: application/json' --data "$slack_payload" "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi

    # Send email notification
    if [[ -n "$EMAIL_RECIPIENTS" ]]; then
        local email_subject="[AI Agency] Backup $status"
        local email_body="$message\n\nTime: $(date)"
        if [[ -n "$file_size" ]]; then
            email_body+="\nSize: $file_size"
        fi

        if command -v mail >/dev/null 2>&1; then
            echo -e "$email_body" | mail -s "$email_subject" "$EMAIL_RECIPIENTS"
        fi
    fi
}

# Create backup
create_backup() {
    local backup_type="${1:-manual}"
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_name="backup-$backup_type-$timestamp"
    local backup_path="$TEMP_DIR/$backup_name"

    info "🚀 Starting $backup_type backup: $backup_name"

    # Create backup directory
    mkdir -p "$backup_path"

    # Set backup type for manifest
    export BACKUP_TYPE="$backup_type"

    # Create manifest
    create_manifest "$backup_path"

    # Backup components
    backup_application "$backup_path"
    backup_configuration "$backup_path"
    backup_environment "$backup_path"
    backup_redis "$backup_path"
    backup_postgres "$backup_path"
    backup_mongodb "$backup_path"
    backup_logs "$backup_path"

    # Create final archive
    local final_backup_dir
    case $backup_type in
        "daily") final_backup_dir="$BACKUP_DIR/daily" ;;
        "weekly") final_backup_dir="$BACKUP_DIR/weekly" ;;
        "monthly") final_backup_dir="$BACKUP_DIR/monthly" ;;
        *) final_backup_dir="$BACKUP_DIR/manual" ;;
    esac

    local final_backup_file="$final_backup_dir/$backup_name.tar.gz"

    info "Creating final backup archive..."
    tar -czf "$final_backup_file" -C "$TEMP_DIR" "$backup_name" || {
        error_exit "Failed to create final backup archive"
    }

    # Encrypt if enabled
    if [[ -n "$ENCRYPTION_KEY" ]]; then
        encrypt_backup "$final_backup_file"
        final_backup_file="$final_backup_file.encrypted.tar.gz"
    fi

    # Check backup size
    local backup_size
    backup_size=$(du -b "$final_backup_file" | cut -f1)
    local max_size_bytes
    max_size_bytes=$(echo "$MAX_BACKUP_SIZE" | sed 's/G/*1024*1024*1024/' | sed 's/M/*1024*1024/' | sed 's/K/*1024/' | bc)

    if [[ "$backup_size" -gt "$max_size_bytes" ]]; then
        warn "Backup size $(du -h "$final_backup_file" | cut -f1) exceeds maximum size $MAX_BACKUP_SIZE"
    fi

    # Upload to cloud storage
    upload_to_cloud "$final_backup_file"

    # Clean old backups
    clean_old_backups

    local file_size
    file_size=$(du -h "$final_backup_file" | cut -f1)
    success "🎉 Backup completed successfully: $final_backup_file ($file_size)"

    # Send notification
    send_notification "success" "Backup completed successfully" "$final_backup_file"

    echo "$final_backup_file"
}

# Restore backup
restore_backup() {
    local backup_file="$1"
    local restore_path="${2:-$PROJECT_DIR}"

    if [[ ! -f "$backup_file" ]]; then
        error_exit "Backup file not found: $backup_file"
    fi

    info "🔄 Starting restore from: $backup_file"

    # Create restore directory
    local restore_temp="$TEMP_DIR/restore-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$restore_temp"

    # Extract backup
    info "Extracting backup..."
    if [[ "$backup_file" == *.encrypted.* ]]; then
        if [[ -z "$ENCRYPTION_KEY" ]]; then
            error_exit "Backup is encrypted but no encryption key provided"
        fi

        openssl enc -d -"$ENCRYPTION_ALGORITHM" -k "$ENCRYPTION_KEY" -in "$backup_file" | \
            tar -xzf - -C "$restore_temp" || {
            error_exit "Failed to decrypt and extract backup"
        }
    else
        tar -xzf "$backup_file" -C "$restore_temp" || {
            error_exit "Failed to extract backup"
        }
    fi

    # Find backup directory
    local backup_dir
    backup_dir=$(find "$restore_temp" -maxdepth 1 -type d -name "backup-*" | head -n1)

    if [[ -z "$backup_dir" ]]; then
        error_exit "Invalid backup structure"
    fi

    # Read manifest
    local manifest_file="$backup_dir/manifest.json"
    if [[ -f "$manifest_file" ]]; then
        info "Backup manifest:"
        jq . "$manifest_file"
    else
        warn "No manifest found in backup"
    fi

    # Restore components
    info "Restoring application files..."
    if [[ -f "$backup_dir/application.tar.gz" ]]; then
        tar -xzf "$backup_dir/application.tar.gz" -C "$restore_path" || {
            error "Failed to restore application files"
        }
    fi

    info "Restoring configuration files..."
    if [[ -f "$backup_dir/configuration.tar.gz" ]]; then
        tar -xzf "$backup_dir/configuration.tar.gz" -C "$restore_path" || {
            error "Failed to restore configuration files"
        }
    fi

    # Restore databases
    if [[ -f "$backup_dir/redis.rdb.gz" ]]; then
        info "Redis backup found. Manual restore required."
        warn "To restore Redis: gunzip $backup_dir/redis.rdb.gz && redis-cli --rdb $backup_dir/redis.rdb"
    fi

    if [[ -f "$backup_dir/postgres.sql.gz" ]]; then
        info "PostgreSQL backup found. Manual restore required."
        warn "To restore PostgreSQL: gunzip $backup_dir/postgres.sql.gz && psql $POSTGRES_DB < $backup_dir/postgres.sql"
    fi

    if [[ -f "$backup_dir/mongodb.tar.gz" ]]; then
        info "MongoDB backup found. Manual restore required."
        warn "To restore MongoDB: tar -xzf $backup_dir/mongodb.tar.gz && mongorestore $backup_dir/mongodb"
    fi

    success "🎉 Restore completed successfully"

    # Send notification
    send_notification "success" "Restore completed successfully" "$backup_file"
}

# List backups
list_backups() {
    info "📋 Available backups:"

    local backup_types=("daily" "weekly" "monthly" "manual")

    for backup_type in "${backup_types[@]}"; do
        local backup_dir="$BACKUP_DIR/$backup_type"
        if [[ -d "$backup_dir" ]] && [[ -n "$(ls -A "$backup_dir" 2>/dev/null)" ]]; then
            echo ""
            echo "$backup_type backups:"
            echo "=================="

            for backup_file in "$backup_dir"/*.tar.gz; do
                if [[ -f "$backup_file" ]]; then
                    local file_size
                    file_size=$(du -h "$backup_file" | cut -f1)
                    local file_date
                    file_date=$(date -r "$backup_file" '+%Y-%m-%d %H:%M:%S')
                    printf "%-50s %8s %s\n" "$(basename "$backup_file")" "$file_size" "$file_date"
                fi
            done
        fi
    done
}

# Main function
main() {
    local action="${1:-backup}"
    shift || true

    setup_backup_env
    check_prerequisites

    case $action in
        "backup")
            local backup_type="${1:-manual}"
            create_backup "$backup_type"
            ;;
        "restore")
            local backup_file="$1"
            local restore_path="$2"
            restore_backup "$backup_file" "$restore_path"
            ;;
        "list")
            list_backups
            ;;
        "clean")
            clean_old_backups
            ;;
        *)
            error "Unknown action: $action"
            exit 1
            ;;
    esac
}

# Script usage
usage() {
    echo "Usage: $0 [ACTION] [OPTIONS]"
    echo ""
    echo "Actions:"
    echo "  backup [TYPE]           Create backup (TYPE: daily, weekly, monthly, manual)"
    echo "  restore FILE [PATH]     Restore from backup file"
    echo "  list                    List available backups"
    echo "  clean                   Clean old backups"
    echo ""
    echo "Options:"
    echo "  -h, --help             Show this help message"
    echo "  -e, --encrypt          Enable encryption (requires BACKUP_ENCRYPTION_KEY)"
    echo "  -c, --cloud            Upload to cloud storage"
    echo "  -v, --verbose          Enable verbose output"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_ENCRYPTION_KEY  Encryption key for backups"
    echo "  AWS_S3_BUCKET         AWS S3 bucket for cloud backup"
    echo "  GCP_BUCKET            Google Cloud Storage bucket"
    echo "  AZURE_CONTAINER       Azure Blob Storage container"
    echo "  SLACK_WEBHOOK_URL     Slack webhook for notifications"
    echo "  EMAIL_RECIPIENTS      Email addresses for notifications"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -e|--encrypt)
            if [[ -z "$ENCRYPTION_KEY" ]]; then
                read -s -p "Enter encryption key: " ENCRYPTION_KEY
                echo
                export ENCRYPTION_KEY
            fi
            shift
            ;;
        -c|--cloud)
            # Cloud upload is enabled by default if credentials are available
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        -*)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            # This is the action, break and let main() handle it
            break
            ;;
    esac
done

# Run main function
main "$@"
