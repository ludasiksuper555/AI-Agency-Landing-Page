#!/bin/bash

# =============================================================================
# AI Agency Landing Page - Monitoring and Maintenance Script
# =============================================================================
# Automated monitoring script for system health and maintenance tasks

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_DIR/logs"
MONITORING_DIR="$PROJECT_DIR/monitoring"
ALERTS_DIR="$PROJECT_DIR/alerts"
BACKUP_DIR="$PROJECT_DIR/backups"

# Monitoring configuration
APP_URL="http://localhost:3000"
API_HEALTH_ENDPOINT="$APP_URL/api/health"
METRICS_ENDPOINT="$APP_URL/api/metrics"
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3001"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=2000  # milliseconds
ERROR_RATE_THRESHOLD=5        # percentage
UPTIME_THRESHOLD=99.9         # percentage

# Notification settings
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-}"
SMTP_SERVER="${SMTP_SERVER:-}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"

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
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOGS_DIR/monitor.log"
}

info() { log "INFO" "${BLUE}ℹ️  $*${NC}"; }
warn() { log "WARN" "${YELLOW}⚠️  $*${NC}"; }
error() { log "ERROR" "${RED}❌ $*${NC}"; }
success() { log "SUCCESS" "${GREEN}✅ $*${NC}"; }
alert() { log "ALERT" "${RED}🚨 $*${NC}"; }
metric() { log "METRIC" "${CYAN}📊 $*${NC}"; }

# Setup monitoring environment
setup_monitoring() {
    info "Setting up monitoring environment..."

    # Create directories
    mkdir -p "$LOGS_DIR" "$MONITORING_DIR" "$ALERTS_DIR" "$BACKUP_DIR"

    # Initialize monitoring files
    local monitoring_files=(
        "$MONITORING_DIR/uptime.log"
        "$MONITORING_DIR/performance.log"
        "$MONITORING_DIR/errors.log"
        "$MONITORING_DIR/resources.log"
        "$ALERTS_DIR/active_alerts.json"
    )

    for file in "${monitoring_files[@]}"; do
        touch "$file"
    done

    # Initialize alerts file
    echo '[]' > "$ALERTS_DIR/active_alerts.json"

    success "Monitoring environment setup completed"
}

# Check application health
check_app_health() {
    info "Checking application health..."

    local start_time=$(date +%s%3N)
    local response_code
    local response_time

    # Check main application
    if response_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL"); then
        local end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))

        if [[ "$response_code" == "200" ]]; then
            success "Application is healthy (HTTP $response_code, ${response_time}ms)"
            log_metric "app_status" "healthy" "$response_time"
        else
            alert "Application returned HTTP $response_code"
            send_alert "Application Health" "Application returned HTTP $response_code"
            log_metric "app_status" "unhealthy" "$response_time"
        fi
    else
        alert "Application is not responding"
        send_alert "Application Health" "Application is not responding"
        log_metric "app_status" "down" "0"
    fi

    # Check API health endpoint
    if curl -f -s "$API_HEALTH_ENDPOINT" > /dev/null; then
        success "API health endpoint is responding"
    else
        alert "API health endpoint is not responding"
        send_alert "API Health" "API health endpoint is not responding"
    fi

    # Check response time
    if [[ -n "${response_time:-}" ]] && [[ "$response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]]; then
        alert "Response time ${response_time}ms exceeds threshold ${RESPONSE_TIME_THRESHOLD}ms"
        send_alert "Performance" "Response time ${response_time}ms exceeds threshold"
    fi
}

# Check system resources
check_system_resources() {
    info "Checking system resources..."

    # CPU usage
    local cpu_usage
    if command -v top >/dev/null 2>&1; then
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    elif command -v ps >/dev/null 2>&1; then
        cpu_usage=$(ps -A -o %cpu | awk '{s+=$1} END {print s}')
    else
        cpu_usage="unknown"
    fi

    if [[ "$cpu_usage" != "unknown" ]] && (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        alert "CPU usage ${cpu_usage}% exceeds threshold ${CPU_THRESHOLD}%"
        send_alert "System Resources" "High CPU usage: ${cpu_usage}%"
    else
        metric "CPU usage: ${cpu_usage}%"
    fi

    # Memory usage
    local memory_usage
    if command -v free >/dev/null 2>&1; then
        memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    elif command -v vm_stat >/dev/null 2>&1; then
        # macOS
        local pages_free=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local pages_total=$(vm_stat | grep "Pages" | awk '{sum += $3} END {print sum}')
        memory_usage=$(echo "scale=1; (1 - $pages_free / $pages_total) * 100" | bc)
    else
        memory_usage="unknown"
    fi

    if [[ "$memory_usage" != "unknown" ]] && (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        alert "Memory usage ${memory_usage}% exceeds threshold ${MEMORY_THRESHOLD}%"
        send_alert "System Resources" "High memory usage: ${memory_usage}%"
    else
        metric "Memory usage: ${memory_usage}%"
    fi

    # Disk usage
    local disk_usage
    if command -v df >/dev/null 2>&1; then
        disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    else
        disk_usage="unknown"
    fi

    if [[ "$disk_usage" != "unknown" ]] && [[ "$disk_usage" -gt "$DISK_THRESHOLD" ]]; then
        alert "Disk usage ${disk_usage}% exceeds threshold ${DISK_THRESHOLD}%"
        send_alert "System Resources" "High disk usage: ${disk_usage}%"
    else
        metric "Disk usage: ${disk_usage}%"
    fi

    # Log metrics
    log_metric "cpu_usage" "$cpu_usage" "$(date +%s)"
    log_metric "memory_usage" "$memory_usage" "$(date +%s)"
    log_metric "disk_usage" "$disk_usage" "$(date +%s)"
}

# Check Docker containers
check_docker_containers() {
    info "Checking Docker containers..."

    if ! command -v docker >/dev/null 2>&1; then
        warn "Docker not found, skipping container checks"
        return 0
    fi

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        alert "Docker daemon is not running"
        send_alert "Docker" "Docker daemon is not running"
        return 1
    fi

    # Check container status
    local containers
    containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tail -n +2)

    if [[ -z "$containers" ]]; then
        alert "No Docker containers are running"
        send_alert "Docker" "No Docker containers are running"
        return 1
    fi

    # Check each container
    while IFS=$'\t' read -r name status ports; do
        if [[ "$status" == *"Up"* ]]; then
            success "Container $name is running ($status)"
        else
            alert "Container $name is not running ($status)"
            send_alert "Docker" "Container $name is not running: $status"
        fi
    done <<< "$containers"

    # Check container resource usage
    local container_stats
    container_stats=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n +2)

    while IFS=$'\t' read -r name cpu_perc mem_usage; do
        local cpu_num=$(echo "$cpu_perc" | sed 's/%//')
        if (( $(echo "$cpu_num > $CPU_THRESHOLD" | bc -l) )); then
            alert "Container $name CPU usage $cpu_perc exceeds threshold"
            send_alert "Docker" "Container $name high CPU usage: $cpu_perc"
        fi
        metric "Container $name: CPU $cpu_perc, Memory $mem_usage"
    done <<< "$container_stats"
}

# Check Redis
check_redis() {
    info "Checking Redis..."

    if ! command -v redis-cli >/dev/null 2>&1; then
        warn "Redis CLI not found, skipping Redis checks"
        return 0
    fi

    # Check Redis connectivity
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q "PONG"; then
        success "Redis is responding"
    else
        alert "Redis is not responding"
        send_alert "Redis" "Redis is not responding"
        return 1
    fi

    # Check Redis memory usage
    local redis_memory
    redis_memory=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    metric "Redis memory usage: $redis_memory"

    # Check Redis connected clients
    local redis_clients
    redis_clients=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info clients | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
    metric "Redis connected clients: $redis_clients"
}

# Check SSL certificates
check_ssl_certificates() {
    info "Checking SSL certificates..."

    local ssl_domains=("localhost" "example.com")

    for domain in "${ssl_domains[@]}"; do
        if command -v openssl >/dev/null 2>&1; then
            local cert_info
            cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

            if [[ -n "$cert_info" ]]; then
                local expiry_date
                expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                local expiry_timestamp
                expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
                local current_timestamp
                current_timestamp=$(date +%s)
                local days_until_expiry
                days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

                if [[ "$days_until_expiry" -lt 30 ]]; then
                    alert "SSL certificate for $domain expires in $days_until_expiry days"
                    send_alert "SSL Certificate" "Certificate for $domain expires in $days_until_expiry days"
                else
                    success "SSL certificate for $domain is valid ($days_until_expiry days remaining)"
                fi
            else
                warn "Could not check SSL certificate for $domain"
            fi
        else
            warn "OpenSSL not found, skipping SSL certificate checks"
            break
        fi
    done
}

# Check log files for errors
check_logs() {
    info "Checking log files for errors..."

    local log_files=(
        "$LOGS_DIR/app.log"
        "$LOGS_DIR/error.log"
        "$LOGS_DIR/access.log"
        "/var/log/nginx/error.log"
        "/var/log/nginx/access.log"
    )

    local error_patterns=(
        "ERROR"
        "FATAL"
        "Exception"
        "500 Internal Server Error"
        "502 Bad Gateway"
        "503 Service Unavailable"
        "504 Gateway Timeout"
    )

    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            local recent_errors
            recent_errors=$(tail -n 1000 "$log_file" | grep -E "$(IFS='|'; echo "${error_patterns[*]}")" | wc -l)

            if [[ "$recent_errors" -gt 0 ]]; then
                warn "Found $recent_errors recent errors in $log_file"

                # Show last few errors
                local last_errors
                last_errors=$(tail -n 1000 "$log_file" | grep -E "$(IFS='|'; echo "${error_patterns[*]}")" | tail -n 5)
                echo "Recent errors:"
                echo "$last_errors"

                if [[ "$recent_errors" -gt 10 ]]; then
                    alert "High error rate in $log_file: $recent_errors errors"
                    send_alert "Log Errors" "High error rate in $log_file: $recent_errors errors"
                fi
            else
                success "No recent errors in $log_file"
            fi
        fi
    done
}

# Check external dependencies
check_external_dependencies() {
    info "Checking external dependencies..."

    local external_services=(
        "https://api.clerk.dev/v1/health"
        "https://cdn.contentful.com/"
        "https://www.google-analytics.com/"
        "https://sentry.io/api/0/"
    )

    for service in "${external_services[@]}"; do
        local service_name
        service_name=$(echo "$service" | sed 's|https://||' | sed 's|/.*||')

        if curl -f -s --max-time 10 "$service" >/dev/null; then
            success "External service $service_name is reachable"
        else
            warn "External service $service_name is not reachable"
            # Don't send alerts for external services as they're outside our control
        fi
    done
}

# Performance monitoring
check_performance() {
    info "Checking application performance..."

    # Check response times for key endpoints
    local endpoints=(
        "$APP_URL/"
        "$APP_URL/api/health"
        "$APP_URL/about"
        "$APP_URL/contact"
    )

    for endpoint in "${endpoints[@]}"; do
        local start_time
        start_time=$(date +%s%3N)

        if curl -f -s "$endpoint" >/dev/null; then
            local end_time
            end_time=$(date +%s%3N)
            local response_time
            response_time=$((end_time - start_time))

            if [[ "$response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]]; then
                alert "Endpoint $endpoint response time ${response_time}ms exceeds threshold"
                send_alert "Performance" "Slow response from $endpoint: ${response_time}ms"
            else
                metric "Endpoint $endpoint response time: ${response_time}ms"
            fi

            log_metric "response_time" "$endpoint" "$response_time"
        else
            alert "Endpoint $endpoint is not responding"
            send_alert "Performance" "Endpoint $endpoint is not responding"
        fi
    done
}

# Database maintenance
run_maintenance() {
    info "Running maintenance tasks..."

    # Clean old log files
    find "$LOGS_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

    # Clean old backups
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

    # Clean old monitoring data
    find "$MONITORING_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true

    # Optimize Redis if available
    if command -v redis-cli >/dev/null 2>&1; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGREWRITEAOF >/dev/null 2>&1 || true
    fi

    # Docker cleanup
    if command -v docker >/dev/null 2>&1; then
        docker system prune -f >/dev/null 2>&1 || true
    fi

    success "Maintenance tasks completed"
}

# Log metrics
log_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp="$3"

    echo "$(date '+%Y-%m-%d %H:%M:%S'),$metric_name,$metric_value,$timestamp" >> "$MONITORING_DIR/metrics.csv"
}

# Send alerts
send_alert() {
    local alert_type="$1"
    local alert_message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Log alert
    echo "[$timestamp] ALERT: $alert_type - $alert_message" >> "$ALERTS_DIR/alerts.log"

    # Add to active alerts
    local alert_json
    alert_json=$(jq -n --arg type "$alert_type" --arg message "$alert_message" --arg timestamp "$timestamp"
        '{type: $type, message: $message, timestamp: $timestamp}')

    local active_alerts
    active_alerts=$(cat "$ALERTS_DIR/active_alerts.json")
    echo "$active_alerts" | jq ". + [$alert_json]" > "$ALERTS_DIR/active_alerts.json"

    # Send Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local slack_payload
        slack_payload=$(jq -n --arg text "🚨 *$alert_type Alert*\n$alert_message\n_Time: $timestamp_" '{text: $text}')
        curl -X POST -H 'Content-type: application/json' --data "$slack_payload" "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi

    # Send email notification
    if [[ -n "$EMAIL_RECIPIENTS" ]] && [[ -n "$SMTP_SERVER" ]]; then
        send_email "$alert_type Alert" "$alert_message\n\nTime: $timestamp"
    fi
}

# Send email
send_email() {
    local subject="$1"
    local body="$2"

    if command -v mail >/dev/null 2>&1; then
        echo -e "$body" | mail -s "[AI Agency] $subject" "$EMAIL_RECIPIENTS"
    elif command -v sendmail >/dev/null 2>&1; then
        {
            echo "To: $EMAIL_RECIPIENTS"
            echo "Subject: [AI Agency] $subject"
            echo ""
            echo -e "$body"
        } | sendmail "$EMAIL_RECIPIENTS"
    fi
}

# Generate monitoring report
generate_report() {
    info "Generating monitoring report..."

    local report_file="$MONITORING_DIR/report-$(date +%Y%m%d-%H%M%S).html"

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Report - AI Agency Landing Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
        .alert { color: red; font-weight: bold; }
        .success { color: green; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Monitoring Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>System:</strong> AI Agency Landing Page</p>
    </div>

    <div class="section">
        <h2>🚨 Active Alerts</h2>
EOF

    # Add active alerts
    local alert_count
    alert_count=$(jq length "$ALERTS_DIR/active_alerts.json")

    if [[ "$alert_count" -gt 0 ]]; then
        echo "        <p class=\"alert\">$alert_count active alerts</p>" >> "$report_file"
        jq -r '.[] | "<div class=\"alert\">" + .type + ": " + .message + " (" + .timestamp + ")</div>"' "$ALERTS_DIR/active_alerts.json" >> "$report_file"
    else
        echo "        <p class=\"success\">No active alerts</p>" >> "$report_file"
    fi

    cat >> "$report_file" << EOF
    </div>

    <div class="section">
        <h2>📈 System Metrics</h2>
        <p>Latest system resource usage and performance metrics.</p>
    </div>

    <div class="section">
        <h2>📋 Recent Logs</h2>
        <p>Recent log entries and error summaries.</p>
    </div>
</body>
</html>
EOF

    success "Monitoring report generated: $report_file"
}

# Main monitoring function
main() {
    info "🔍 Starting system monitoring..."
    echo "===================================="

    setup_monitoring

    # Run all checks
    check_app_health
    check_system_resources
    check_docker_containers
    check_redis
    check_ssl_certificates
    check_logs
    check_external_dependencies
    check_performance

    # Run maintenance if requested
    if [[ "${RUN_MAINTENANCE:-false}" == "true" ]]; then
        run_maintenance
    fi

    # Generate report
    generate_report

    success "🎉 Monitoring completed successfully!"
    info "📊 Report available at: $MONITORING_DIR"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  -c, --continuous  Run in continuous mode (daemon)"
    echo "  -i, --interval    Set monitoring interval in seconds (default: 300)"
    echo "  -m, --maintenance Run maintenance tasks"
    echo "  --health-only     Check application health only"
    echo "  --resources-only  Check system resources only"
    echo "  --docker-only     Check Docker containers only"
    echo "  --logs-only       Check logs only"
    echo "  --report          Generate report only"
}

# Parse command line arguments
CONTINUOUS_MODE=false
MONITORING_INTERVAL=300

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -c|--continuous)
            CONTINUOUS_MODE=true
            shift
            ;;
        -i|--interval)
            MONITORING_INTERVAL="$2"
            shift 2
            ;;
        -m|--maintenance)
            export RUN_MAINTENANCE=true
            shift
            ;;
        --health-only)
            setup_monitoring
            check_app_health
            exit 0
            ;;
        --resources-only)
            setup_monitoring
            check_system_resources
            exit 0
            ;;
        --docker-only)
            setup_monitoring
            check_docker_containers
            exit 0
            ;;
        --logs-only)
            setup_monitoring
            check_logs
            exit 0
            ;;
        --report)
            setup_monitoring
            generate_report
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run monitoring
if [[ "$CONTINUOUS_MODE" == "true" ]]; then
    info "Starting continuous monitoring (interval: ${MONITORING_INTERVAL}s)"
    while true; do
        main
        sleep "$MONITORING_INTERVAL"
    done
else
    main
fi
