#!/bin/bash

# =============================================================================
# AI Agency Landing Page - Development Setup Script
# =============================================================================
# Automated setup script for development environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NODE_VERSION="18.17.0"
NPM_VERSION="9.6.7"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
error() { echo -e "${RED}❌ $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
step() { echo -e "${PURPLE}🔧 $*${NC}"; }

# Error handling
error_exit() {
    error "$1"
    exit 1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Install Node.js via NVM
install_nodejs() {
    step "Setting up Node.js..."

    if command_exists node; then
        local current_version=$(node --version | sed 's/v//')
        if [[ "$current_version" == "$NODE_VERSION" ]]; then
            success "Node.js $NODE_VERSION is already installed"
            return 0
        else
            warn "Node.js $current_version is installed, but we need $NODE_VERSION"
        fi
    fi

    # Install NVM if not present
    if ! command_exists nvm; then
        info "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi

    # Install and use Node.js
    info "Installing Node.js $NODE_VERSION..."
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    nvm alias default "$NODE_VERSION"

    success "Node.js $NODE_VERSION installed successfully"
}

# Install package managers
install_package_managers() {
    step "Setting up package managers..."

    # Update npm
    info "Updating npm to version $NPM_VERSION..."
    npm install -g npm@"$NPM_VERSION"

    # Install yarn if not present
    if ! command_exists yarn; then
        info "Installing Yarn..."
        npm install -g yarn
    fi

    # Install pnpm if not present
    if ! command_exists pnpm; then
        info "Installing pnpm..."
        npm install -g pnpm
    fi

    success "Package managers installed successfully"
}

# Install Docker
install_docker() {
    step "Checking Docker installation..."

    if command_exists docker && command_exists docker-compose; then
        success "Docker and Docker Compose are already installed"
        return 0
    fi

    local os=$(detect_os)

    case $os in
        "linux")
            info "Installing Docker on Linux..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker "$USER"

            # Install Docker Compose
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            ;;
        "macos")
            warn "Please install Docker Desktop for Mac from: https://docs.docker.com/desktop/mac/install/"
            ;;
        "windows")
            warn "Please install Docker Desktop for Windows from: https://docs.docker.com/desktop/windows/install/"
            ;;
        *)
            warn "Unsupported OS. Please install Docker manually."
            ;;
    esac

    success "Docker installation completed"
}

# Install development tools
install_dev_tools() {
    step "Installing development tools..."

    # Global npm packages
    local global_packages=(
        "@next/codemod"
        "eslint"
        "prettier"
        "typescript"
        "ts-node"
        "nodemon"
        "concurrently"
        "cross-env"
        "rimraf"
        "husky"
        "lint-staged"
        "commitizen"
        "cz-conventional-changelog"
        "semantic-release"
        "lighthouse"
        "@storybook/cli"
    )

    info "Installing global npm packages..."
    for package in "${global_packages[@]}"; do
        npm install -g "$package"
    done

    # VS Code extensions (if VS Code is installed)
    if command_exists code; then
        info "Installing VS Code extensions..."
        local extensions=(
            "ms-vscode.vscode-typescript-next"
            "bradlc.vscode-tailwindcss"
            "esbenp.prettier-vscode"
            "dbaeumer.vscode-eslint"
            "ms-vscode.vscode-json"
            "redhat.vscode-yaml"
            "ms-vscode-remote.remote-containers"
            "ms-vscode.vscode-docker"
            "github.copilot"
            "github.vscode-pull-request-github"
            "gruntfuggly.todo-tree"
            "streetsidesoftware.code-spell-checker"
            "christian-kohler.path-intellisense"
            "formulahendry.auto-rename-tag"
            "bradlc.vscode-tailwindcss"
        )

        for extension in "${extensions[@]}"; do
            code --install-extension "$extension" --force
        done
    fi

    success "Development tools installed successfully"
}

# Setup environment files
setup_environment() {
    step "Setting up environment files..."

    cd "$PROJECT_DIR"

    # Copy environment files
    if [[ ! -f ".env.local" ]]; then
        if [[ -f ".env.example" ]]; then
            cp ".env.example" ".env.local"
            info "Created .env.local from .env.example"
        else
            warn ".env.example not found. Creating basic .env.local"
            cat > ".env.local" << EOF
# Development Environment Variables
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Contentful CMS
CONTENTFUL_SPACE_ID=your_contentful_space_id
CONTENTFUL_ACCESS_TOKEN=your_contentful_access_token
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_contentful_preview_token

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Error Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
EOF
        fi
    else
        success ".env.local already exists"
    fi

    # Create additional environment files
    local env_files=(".env.development" ".env.test" ".env.staging")
    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            cp ".env.local" "$env_file"
            info "Created $env_file"
        fi
    done

    success "Environment files setup completed"
}

# Install project dependencies
install_dependencies() {
    step "Installing project dependencies..."

    cd "$PROJECT_DIR"

    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        error_exit "package.json not found. Are you in the correct directory?"
    fi

    # Install dependencies
    info "Installing npm dependencies..."
    npm install

    # Install Husky hooks
    if [[ -f "package.json" ]] && grep -q "husky" "package.json"; then
        info "Setting up Husky git hooks..."
        npx husky install
    fi

    success "Dependencies installed successfully"
}

# Setup Git hooks
setup_git_hooks() {
    step "Setting up Git hooks..."

    cd "$PROJECT_DIR"

    # Initialize git if not already done
    if [[ ! -d ".git" ]]; then
        info "Initializing Git repository..."
        git init
        git add .
        git commit -m "Initial commit"
    fi

    # Setup commitizen
    if ! grep -q '"config"' package.json; then
        info "Setting up Commitizen..."
        echo '  "config": {' >> package.json.tmp
        echo '    "commitizen": {' >> package.json.tmp
        echo '      "path": "cz-conventional-changelog"' >> package.json.tmp
        echo '    }' >> package.json.tmp
        echo '  },' >> package.json.tmp

        # Insert config before the last closing brace
        sed '$d' package.json > package.json.tmp2
        cat package.json.tmp2 package.json.tmp > package.json
        echo '}' >> package.json
        rm package.json.tmp package.json.tmp2
    fi

    success "Git hooks setup completed"
}

# Create development scripts
create_dev_scripts() {
    step "Creating development scripts..."

    local scripts_dir="$PROJECT_DIR/scripts"
    mkdir -p "$scripts_dir"

    # Create start script
    cat > "$scripts_dir/start-dev.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting development environment..."
echo "📦 Installing dependencies..."
npm install
echo "🔧 Starting development server..."
npm run dev
EOF

    # Create test script
    cat > "$scripts_dir/run-tests.sh" << 'EOF'
#!/bin/bash
echo "🧪 Running tests..."
echo "📋 Running linting..."
npm run lint
echo "🔍 Running type checking..."
npm run type-check
echo "🧪 Running unit tests..."
npm test
echo "📊 Running test coverage..."
npm run test:coverage
EOF

    # Create build script
    cat > "$scripts_dir/build-prod.sh" << 'EOF'
#!/bin/bash
echo "🏗️  Building for production..."
echo "📦 Installing dependencies..."
npm ci
echo "🔧 Building application..."
npm run build
echo "🧪 Running production tests..."
npm run test:prod
echo "✅ Build completed successfully!"
EOF

    # Make scripts executable
    chmod +x "$scripts_dir"/*.sh

    success "Development scripts created"
}

# Setup IDE configuration
setup_ide_config() {
    step "Setting up IDE configuration..."

    cd "$PROJECT_DIR"

    # VS Code settings
    mkdir -p ".vscode"

    cat > ".vscode/settings.json" << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/out": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/out": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
EOF

    cat > ".vscode/extensions.json" << 'EOF'
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-docker",
    "github.copilot",
    "github.vscode-pull-request-github"
  ]
}
EOF

    success "IDE configuration completed"
}

# Run initial checks
run_initial_checks() {
    step "Running initial checks..."

    cd "$PROJECT_DIR"

    # Check if everything is working
    info "Checking Node.js installation..."
    node --version
    npm --version

    info "Checking project structure..."
    if [[ -f "package.json" ]]; then
        success "package.json found"
    else
        warn "package.json not found"
    fi

    if [[ -f "next.config.js" ]] || [[ -f "next.config.mjs" ]]; then
        success "Next.js configuration found"
    else
        warn "Next.js configuration not found"
    fi

    info "Checking dependencies..."
    npm list --depth=0 || warn "Some dependencies might be missing"

    success "Initial checks completed"
}

# Main setup function
main() {
    echo "🎯 AI Agency Landing Page - Development Setup"
    echo "============================================="
    echo ""

    install_nodejs
    install_package_managers
    install_docker
    install_dev_tools
    setup_environment
    install_dependencies
    setup_git_hooks
    create_dev_scripts
    setup_ide_config
    run_initial_checks

    echo ""
    success "🎉 Development environment setup completed!"
    echo ""
    info "Next steps:"
    echo "  1. Update .env.local with your actual API keys"
    echo "  2. Run 'npm run dev' to start the development server"
    echo "  3. Open http://localhost:3000 in your browser"
    echo "  4. Start coding! 🚀"
    echo ""
    info "Useful commands:"
    echo "  • npm run dev          - Start development server"
    echo "  • npm run build        - Build for production"
    echo "  • npm run test         - Run tests"
    echo "  • npm run lint         - Run linting"
    echo "  • npm run type-check   - Run TypeScript checks"
    echo "  • git cz               - Commit with Commitizen"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -q, --quick    Quick setup (skip optional tools)"
    echo "  -f, --force    Force reinstall everything"
    echo "  --node-only    Install only Node.js and npm packages"
    echo "  --docker-only  Install only Docker"
    echo "  --tools-only   Install only development tools"
}

# Parse command line arguments
QUICK_SETUP=false
FORCE_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -q|--quick)
            QUICK_SETUP=true
            shift
            ;;
        -f|--force)
            FORCE_INSTALL=true
            shift
            ;;
        --node-only)
            install_nodejs
            install_package_managers
            install_dependencies
            exit 0
            ;;
        --docker-only)
            install_docker
            exit 0
            ;;
        --tools-only)
            install_dev_tools
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main
