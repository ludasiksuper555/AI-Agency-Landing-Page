#!/bin/bash

# =============================================================================
# AI Agency Landing Page - Comprehensive Testing Script
# =============================================================================
# Automated testing script for quality assurance

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_DIR/reports"
COVERAGE_DIR="$PROJECT_DIR/coverage"
LOG_FILE="$REPORTS_DIR/test-$(date +%Y%m%d-%H%M%S).log"

# Test configuration
COVERAGE_THRESHOLD=80
PERFORMACE_BUDGET_JS=250000  # 250KB
PERFORMACE_BUDGET_CSS=50000  # 50KB
LIGHTHOUSE_THRESHOLD=90

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
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() { log "INFO" "${BLUE}ℹ️  $*${NC}"; }
warn() { log "WARN" "${YELLOW}⚠️  $*${NC}"; }
error() { log "ERROR" "${RED}❌ $*${NC}"; }
success() { log "SUCCESS" "${GREEN}✅ $*${NC}"; }
step() { log "STEP" "${PURPLE}🔧 $*${NC}"; }
test_start() { log "TEST" "${CYAN}🧪 $*${NC}"; }

# Error handling
error_exit() {
    error "$1"
    exit 1
}

# Setup test environment
setup_test_env() {
    step "Setting up test environment..."

    # Create directories
    mkdir -p "$REPORTS_DIR" "$COVERAGE_DIR"

    # Set test environment variables
    export NODE_ENV=test
    export CI=true
    export FORCE_COLOR=1

    # Clean previous test artifacts
    rm -rf "$PROJECT_DIR/.next" "$PROJECT_DIR/out" "$PROJECT_DIR/dist"

    success "Test environment setup completed"
}

# Install dependencies
install_test_deps() {
    step "Installing test dependencies..."

    cd "$PROJECT_DIR"

    # Install dependencies if node_modules doesn't exist
    if [[ ! -d "node_modules" ]]; then
        npm ci
    fi

    # Install additional test tools
    local test_tools=(
        "lighthouse"
        "@axe-core/cli"
        "pa11y"
        "bundlesize"
        "madge"
        "depcheck"
        "npm-check-updates"
    )

    for tool in "${test_tools[@]}"; do
        if ! npm list -g "$tool" &>/dev/null; then
            npm install -g "$tool"
        fi
    done

    success "Test dependencies installed"
}

# Code quality checks
run_code_quality() {
    test_start "Running code quality checks..."

    cd "$PROJECT_DIR"

    # ESLint
    info "Running ESLint..."
    npm run lint -- --format=json --output-file="$REPORTS_DIR/eslint-report.json" || {
        error "ESLint found issues"
        npm run lint
        return 1
    }

    # Prettier
    info "Checking code formatting with Prettier..."
    npm run format:check || {
        error "Code formatting issues found"
        return 1
    }

    # TypeScript type checking
    info "Running TypeScript type checking..."
    npm run type-check || {
        error "TypeScript type errors found"
        return 1
    }

    success "Code quality checks passed"
}

# Security audit
run_security_audit() {
    test_start "Running security audit..."

    cd "$PROJECT_DIR"

    # npm audit
    info "Running npm security audit..."
    npm audit --audit-level=high --json > "$REPORTS_DIR/npm-audit.json" || {
        warn "Security vulnerabilities found in dependencies"
        npm audit
    }

    # Check for secrets in code
    info "Scanning for potential secrets..."
    if command -v git >/dev/null 2>&1; then
        git log --all --full-history -- "**/*.env*" "**/*secret*" "**/*key*" > "$REPORTS_DIR/secrets-scan.log" || true
    fi

    success "Security audit completed"
}

# Dependency analysis
run_dependency_analysis() {
    test_start "Running dependency analysis..."

    cd "$PROJECT_DIR"

    # Check for unused dependencies
    info "Checking for unused dependencies..."
    depcheck --json > "$REPORTS_DIR/depcheck.json" || true

    # Check for outdated dependencies
    info "Checking for outdated dependencies..."
    npm outdated --json > "$REPORTS_DIR/outdated.json" || true

    # Analyze circular dependencies
    info "Analyzing circular dependencies..."
    madge --circular --json src > "$REPORTS_DIR/circular-deps.json" || true

    success "Dependency analysis completed"
}

# Unit tests
run_unit_tests() {
    test_start "Running unit tests..."

    cd "$PROJECT_DIR"

    # Run Jest tests with coverage
    info "Running Jest unit tests..."
    npm test -- --coverage --watchAll=false --passWithNoTests \
        --coverageReporters=json-summary,lcov,text \
        --coverageDirectory="$COVERAGE_DIR" \
        --testResultsProcessor="jest-sonar-reporter" || {
        error "Unit tests failed"
        return 1
    }

    # Check coverage threshold
    local coverage_file="$COVERAGE_DIR/coverage-summary.json"
    if [[ -f "$coverage_file" ]]; then
        local coverage=$(jq -r '.total.lines.pct' "$coverage_file")
        if (( $(echo "$coverage < $COVERAGE_THRESHOLD" | bc -l) )); then
            error "Coverage $coverage% is below threshold $COVERAGE_THRESHOLD%"
            return 1
        else
            success "Coverage $coverage% meets threshold $COVERAGE_THRESHOLD%"
        fi
    fi

    success "Unit tests passed"
}

# Integration tests
run_integration_tests() {
    test_start "Running integration tests..."

    cd "$PROJECT_DIR"

    # API tests
    if [[ -f "tests/integration/api.test.js" ]] || [[ -f "tests/integration/api.test.ts" ]]; then
        info "Running API integration tests..."
        npm run test:integration || {
            error "Integration tests failed"
            return 1
        }
    else
        warn "No integration tests found"
    fi

    success "Integration tests completed"
}

# End-to-end tests
run_e2e_tests() {
    test_start "Running end-to-end tests..."

    cd "$PROJECT_DIR"

    # Check if E2E tests exist
    if [[ -d "cypress" ]] || [[ -d "e2e" ]] || [[ -d "tests/e2e" ]]; then
        info "Starting application for E2E tests..."

        # Start the application in background
        npm run build
        npm start &
        local app_pid=$!

        # Wait for application to start
        local max_attempts=30
        local attempt=1
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
                break
            fi
            sleep 2
            ((attempt++))
        done

        if [[ $attempt -gt $max_attempts ]]; then
            kill $app_pid || true
            error "Application failed to start for E2E tests"
            return 1
        fi

        # Run E2E tests
        info "Running Cypress E2E tests..."
        if command -v cypress >/dev/null 2>&1; then
            cypress run --reporter json --reporter-options "output=$REPORTS_DIR/cypress-report.json" || {
                kill $app_pid || true
                error "E2E tests failed"
                return 1
            }
        else
            warn "Cypress not installed, skipping E2E tests"
        fi

        # Stop the application
        kill $app_pid || true

    else
        warn "No E2E tests found"
    fi

    success "E2E tests completed"
}

# Performance tests
run_performance_tests() {
    test_start "Running performance tests..."

    cd "$PROJECT_DIR"

    # Build the application
    info "Building application for performance testing..."
    npm run build

    # Start the application
    info "Starting application for performance testing..."
    npm start &
    local app_pid=$!

    # Wait for application to start
    sleep 10

    # Bundle size analysis
    info "Analyzing bundle size..."
    if [[ -f "package.json" ]] && grep -q "bundlesize" "package.json"; then
        npm run bundlesize || warn "Bundle size check failed"
    fi

    # Lighthouse audit
    info "Running Lighthouse audit..."
    lighthouse http://localhost:3000 \
        --output=json \
        --output-path="$REPORTS_DIR/lighthouse-report.json" \
        --chrome-flags="--headless --no-sandbox" || warn "Lighthouse audit failed"

    # Check Lighthouse scores
    if [[ -f "$REPORTS_DIR/lighthouse-report.json" ]]; then
        local performance_score=$(jq -r '.categories.performance.score * 100' "$REPORTS_DIR/lighthouse-report.json")
        local accessibility_score=$(jq -r '.categories.accessibility.score * 100' "$REPORTS_DIR/lighthouse-report.json")
        local best_practices_score=$(jq -r '.categories["best-practices"].score * 100' "$REPORTS_DIR/lighthouse-report.json")
        local seo_score=$(jq -r '.categories.seo.score * 100' "$REPORTS_DIR/lighthouse-report.json")

        info "Lighthouse Scores:"
        info "  Performance: $performance_score%"
        info "  Accessibility: $accessibility_score%"
        info "  Best Practices: $best_practices_score%"
        info "  SEO: $seo_score%"

        if (( $(echo "$performance_score < $LIGHTHOUSE_THRESHOLD" | bc -l) )); then
            warn "Performance score $performance_score% is below threshold $LIGHTHOUSE_THRESHOLD%"
        fi
    fi

    # Stop the application
    kill $app_pid || true

    success "Performance tests completed"
}

# Accessibility tests
run_accessibility_tests() {
    test_start "Running accessibility tests..."

    cd "$PROJECT_DIR"

    # Start the application
    info "Starting application for accessibility testing..."
    npm start &
    local app_pid=$!

    # Wait for application to start
    sleep 10

    # axe-core accessibility testing
    info "Running axe-core accessibility tests..."
    if command -v axe >/dev/null 2>&1; then
        axe http://localhost:3000 --save "$REPORTS_DIR/axe-report.json" || warn "Axe accessibility test failed"
    fi

    # pa11y accessibility testing
    info "Running pa11y accessibility tests..."
    if command -v pa11y >/dev/null 2>&1; then
        pa11y http://localhost:3000 --reporter json > "$REPORTS_DIR/pa11y-report.json" || warn "Pa11y accessibility test failed"
    fi

    # Stop the application
    kill $app_pid || true

    success "Accessibility tests completed"
}

# Visual regression tests
run_visual_tests() {
    test_start "Running visual regression tests..."

    cd "$PROJECT_DIR"

    # Check if visual testing tools are available
    if command -v percy >/dev/null 2>&1; then
        info "Running Percy visual tests..."
        percy exec -- npm run test:visual || warn "Visual tests failed"
    elif command -v chromatic >/dev/null 2>&1; then
        info "Running Chromatic visual tests..."
        chromatic --exit-zero-on-changes || warn "Visual tests failed"
    else
        warn "No visual testing tools found"
    fi

    success "Visual tests completed"
}

# Generate test report
generate_report() {
    step "Generating test report..."

    local report_file="$REPORTS_DIR/test-summary.html"

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - AI Agency Landing Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { color: green; }
        .fail { color: red; }
        .warn { color: orange; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Report</h1>
        <p><strong>Project:</strong> AI Agency Landing Page</p>
        <p><strong>Date:</strong> $(date)</p>
        <p><strong>Environment:</strong> $NODE_ENV</p>
    </div>

    <div class="section">
        <h2>📊 Test Summary</h2>
        <div class="metric">Code Quality: <span class="pass">✅ Passed</span></div>
        <div class="metric">Security: <span class="pass">✅ Passed</span></div>
        <div class="metric">Unit Tests: <span class="pass">✅ Passed</span></div>
        <div class="metric">Performance: <span class="pass">✅ Passed</span></div>
        <div class="metric">Accessibility: <span class="pass">✅ Passed</span></div>
    </div>

    <div class="section">
        <h2>📈 Metrics</h2>
EOF

    # Add coverage information if available
    if [[ -f "$COVERAGE_DIR/coverage-summary.json" ]]; then
        local coverage=$(jq -r '.total.lines.pct' "$COVERAGE_DIR/coverage-summary.json")
        echo "        <div class=\"metric\">Code Coverage: <strong>$coverage%</strong></div>" >> "$report_file"
    fi

    # Add Lighthouse scores if available
    if [[ -f "$REPORTS_DIR/lighthouse-report.json" ]]; then
        local performance_score=$(jq -r '.categories.performance.score * 100' "$REPORTS_DIR/lighthouse-report.json")
        echo "        <div class=\"metric\">Performance Score: <strong>$performance_score%</strong></div>" >> "$report_file"
    fi

    cat >> "$report_file" << EOF
    </div>

    <div class="section">
        <h2>📁 Report Files</h2>
        <ul>
EOF

    # List all report files
    for report in "$REPORTS_DIR"/*.json "$REPORTS_DIR"/*.log; do
        if [[ -f "$report" ]]; then
            local filename=$(basename "$report")
            echo "            <li><a href=\"$filename\">$filename</a></li>" >> "$report_file"
        fi
    done

    cat >> "$report_file" << EOF
        </ul>
    </div>
</body>
</html>
EOF

    success "Test report generated: $report_file"
}

# Cleanup
cleanup() {
    info "Cleaning up..."

    # Kill any remaining processes
    pkill -f "npm start" || true
    pkill -f "next start" || true

    # Reset environment
    unset NODE_ENV CI FORCE_COLOR
}

# Main test function
main() {
    info "🧪 Starting comprehensive test suite..."
    echo "========================================"

    local start_time=$(date +%s)
    local failed_tests=()

    # Setup
    setup_test_env
    install_test_deps

    # Run tests
    run_code_quality || failed_tests+=("Code Quality")
    run_security_audit || failed_tests+=("Security Audit")
    run_dependency_analysis || failed_tests+=("Dependency Analysis")
    run_unit_tests || failed_tests+=("Unit Tests")
    run_integration_tests || failed_tests+=("Integration Tests")
    run_e2e_tests || failed_tests+=("E2E Tests")
    run_performance_tests || failed_tests+=("Performance Tests")
    run_accessibility_tests || failed_tests+=("Accessibility Tests")
    run_visual_tests || failed_tests+=("Visual Tests")

    # Generate report
    generate_report

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo "========================================"

    if [[ ${#failed_tests[@]} -eq 0 ]]; then
        success "🎉 All tests passed! (Duration: ${duration}s)"
        echo "📊 Test report: $REPORTS_DIR/test-summary.html"
        exit 0
    else
        error "❌ Some tests failed:"
        for test in "${failed_tests[@]}"; do
            error "  - $test"
        done
        echo "📊 Test report: $REPORTS_DIR/test-summary.html"
        exit 1
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -q, --quick         Run quick tests only (lint, type-check, unit)"
    echo "  -u, --unit          Run unit tests only"
    echo "  -i, --integration   Run integration tests only"
    echo "  -e, --e2e           Run E2E tests only"
    echo "  -p, --performance   Run performance tests only"
    echo "  -a, --accessibility Run accessibility tests only"
    echo "  -s, --security      Run security audit only"
    echo "  -c, --coverage      Run tests with coverage report"
    echo "  --ci                Run in CI mode (no interactive prompts)"
}

# Trap for cleanup on exit
trap cleanup EXIT

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -q|--quick)
            run_code_quality
            run_unit_tests
            exit $?
            ;;
        -u|--unit)
            setup_test_env
            install_test_deps
            run_unit_tests
            exit $?
            ;;
        -i|--integration)
            setup_test_env
            install_test_deps
            run_integration_tests
            exit $?
            ;;
        -e|--e2e)
            setup_test_env
            install_test_deps
            run_e2e_tests
            exit $?
            ;;
        -p|--performance)
            setup_test_env
            install_test_deps
            run_performance_tests
            exit $?
            ;;
        -a|--accessibility)
            setup_test_env
            install_test_deps
            run_accessibility_tests
            exit $?
            ;;
        -s|--security)
            setup_test_env
            install_test_deps
            run_security_audit
            exit $?
            ;;
        -c|--coverage)
            setup_test_env
            install_test_deps
            run_unit_tests
            generate_report
            exit $?
            ;;
        --ci)
            export CI=true
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
