# PWA Testing Script for Windows PowerShell
# AI Agency Landing Page - Stage 6

param(
    [string]$Environment = "local",
    [string]$Url = "",
    [switch]$Visible = $false,
    [switch]$Help = $false,
    [switch]$Setup = $false,
    [switch]$Report = $false
)

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🧪 PWA Testing Suite - Stage 6" "Header"
    Write-ColorOutput "=================================" "Header"
    Write-Host ""
    Write-ColorOutput "USAGE:" "Info"
    Write-Host "  .\run-pwa-tests.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorOutput "OPTIONS:" "Info"
    Write-Host "  -Environment <env>    Test environment (local, staging, production)"
    Write-Host "  -Url <url>           Custom URL to test"
    Write-Host "  -Visible             Run tests with visible browser (for debugging)"
    Write-Host "  -Setup               Install dependencies and setup environment"
    Write-Host "  -Report              Open latest test report"
    Write-Host "  -Help                Show this help message"
    Write-Host ""
    Write-ColorOutput "EXAMPLES:" "Info"
    Write-Host "  .\run-pwa-tests.ps1                          # Test local environment"
    Write-Host "  .\run-pwa-tests.ps1 -Environment staging     # Test staging"
    Write-Host "  .\run-pwa-tests.ps1 -Url https://example.com # Test custom URL"
    Write-Host "  .\run-pwa-tests.ps1 -Visible                 # Debug mode"
    Write-Host "  .\run-pwa-tests.ps1 -Setup                   # Setup environment"
    Write-Host "  .\run-pwa-tests.ps1 -Report                  # View last report"
    Write-Host ""
    Write-ColorOutput "ENVIRONMENTS:" "Info"
    Write-Host "  local       http://localhost:3000 (default)"
    Write-Host "  staging     https://staging.yourdomain.com"
    Write-Host "  production  https://yourdomain.com"
    Write-Host ""
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." "Info"

    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" "Success"
    } catch {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js 18+" "Error"
        return $false
    }

    # Check npm
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ npm: $npmVersion" "Success"
    } catch {
        Write-ColorOutput "❌ npm not found" "Error"
        return $false
    }

    # Check if package.json exists
    if (Test-Path "package.json") {
        Write-ColorOutput "✅ package.json found" "Success"
    } else {
        Write-ColorOutput "❌ package.json not found. Run from project root." "Error"
        return $false
    }

    # Check if automated test script exists
    if (Test-Path "automated-pwa-tests.js") {
        Write-ColorOutput "✅ Automated test script found" "Success"
    } else {
        Write-ColorOutput "❌ automated-pwa-tests.js not found" "Error"
        return $false
    }

    return $true
}

function Install-Dependencies {
    Write-ColorOutput "📦 Installing dependencies..." "Info"

    try {
        # Install main dependencies
        Write-ColorOutput "Installing npm packages..." "Info"
        npm install

        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Dependencies installed successfully" "Success"
        } else {
            Write-ColorOutput "❌ Failed to install dependencies" "Error"
            return $false
        }

        # Check if PWA testing dependencies are installed
        $requiredPackages = @("puppeteer", "lighthouse", "chrome-launcher", "chalk")

        foreach ($package in $requiredPackages) {
            try {
                $packageInfo = npm list $package 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✅ $package is installed" "Success"
                } else {
                    Write-ColorOutput "⚠️  $package not found, but may be available" "Warning"
                }
            } catch {
                Write-ColorOutput "⚠️  Could not verify $package installation" "Warning"
            }
        }

        return $true
    } catch {
        Write-ColorOutput "❌ Error installing dependencies: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Get-TestUrl {
    param(
        [string]$Environment,
        [string]$CustomUrl
    )

    if ($CustomUrl) {
        return $CustomUrl
    }

    switch ($Environment.ToLower()) {
        "local" { return "http://localhost:3000" }
        "staging" { return "https://staging.yourdomain.com" }
        "production" { return "https://yourdomain.com" }
        default { return "http://localhost:3000" }
    }
}

function Start-PWATests {
    param(
        [string]$TestUrl,
        [bool]$VisibleMode
    )

    Write-ColorOutput "🚀 Starting PWA tests..." "Info"
    Write-ColorOutput "Target URL: $TestUrl" "Info"
    Write-ColorOutput "Browser Mode: $(if ($VisibleMode) { 'Visible' } else { 'Headless' })" "Info"
    Write-Host ""

    # Set environment variables
    $env:TEST_URL = $TestUrl
    $env:HEADLESS = if ($VisibleMode) { "false" } else { "true" }

    try {
        # Run the automated tests
        Write-ColorOutput "Executing automated PWA tests..." "Info"
        node automated-pwa-tests.js

        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ PWA tests completed successfully!" "Success"
            return $true
        } else {
            Write-ColorOutput "⚠️  PWA tests completed with issues. Check the report for details." "Warning"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error running PWA tests: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Show-TestResults {
    Write-ColorOutput "📊 Test Results" "Header"
    Write-ColorOutput "===============" "Header"

    # Check for test results
    $resultsDir = "test-results"
    $htmlReport = Join-Path $resultsDir "pwa-test-report.html"
    $jsonReport = Join-Path $resultsDir "pwa-test-results.json"

    if (Test-Path $htmlReport) {
        Write-ColorOutput "📋 HTML Report: $htmlReport" "Success"

        # Ask if user wants to open the report
        $openReport = Read-Host "Open HTML report in browser? (y/N)"
        if ($openReport -eq "y" -or $openReport -eq "Y") {
            Start-Process $htmlReport
        }
    } else {
        Write-ColorOutput "❌ HTML report not found" "Error"
    }

    if (Test-Path $jsonReport) {
        Write-ColorOutput "📄 JSON Report: $jsonReport" "Success"

        # Try to show summary from JSON
        try {
            $results = Get-Content $jsonReport | ConvertFrom-Json
            if ($results.summary) {
                Write-Host ""
                Write-ColorOutput "📈 Test Summary:" "Info"
                Write-Host "  Total Tests: $($results.summary.total)"
                Write-Host "  Passed: $($results.summary.passed)" -ForegroundColor Green
                Write-Host "  Failed: $($results.summary.failed)" -ForegroundColor Red
                Write-Host "  Success Rate: $($results.summary.successRate)%" -ForegroundColor $(if ($results.summary.successRate -ge 85) { "Green" } else { "Red" })
            }
        } catch {
            Write-ColorOutput "⚠️  Could not parse JSON report" "Warning"
        }
    } else {
        Write-ColorOutput "❌ JSON report not found" "Error"
    }
}

function Open-LatestReport {
    $resultsDir = "test-results"
    $htmlReport = Join-Path $resultsDir "pwa-test-report.html"

    if (Test-Path $htmlReport) {
        Write-ColorOutput "📋 Opening latest test report..." "Info"
        Start-Process $htmlReport
    } else {
        Write-ColorOutput "❌ No test report found. Run tests first." "Error"
        Write-ColorOutput "Use: .\run-pwa-tests.ps1" "Info"
    }
}

function Show-ManualTestingGuide {
    Write-ColorOutput "📖 Manual Testing Guide" "Header"
    Write-ColorOutput "=======================" "Header"

    if (Test-Path "manual-pwa-testing-guide.md") {
        Write-ColorOutput "📋 Manual testing guide: manual-pwa-testing-guide.md" "Success"

        $openGuide = Read-Host "Open manual testing guide? (y/N)"
        if ($openGuide -eq "y" -or $openGuide -eq "Y") {
            Start-Process "manual-pwa-testing-guide.md"
        }
    } else {
        Write-ColorOutput "❌ Manual testing guide not found" "Error"
    }

    if (Test-Path "README-PWA-Testing.md") {
        Write-ColorOutput "📚 Testing documentation: README-PWA-Testing.md" "Success"

        $openReadme = Read-Host "Open testing documentation? (y/N)"
        if ($openReadme -eq "y" -or $openReadme -eq "Y") {
            Start-Process "README-PWA-Testing.md"
        }
    }
}

# Main script execution
Clear-Host
Write-ColorOutput "🧪 PWA Testing Suite - Stage 6" "Header"
Write-ColorOutput "=================================" "Header"
Write-Host ""

# Handle help flag
if ($Help) {
    Show-Help
    exit 0
}

# Handle setup flag
if ($Setup) {
    Write-ColorOutput "🔧 Setting up PWA testing environment..." "Info"

    if (-not (Test-Prerequisites)) {
        Write-ColorOutput "❌ Prerequisites check failed" "Error"
        exit 1
    }

    if (Install-Dependencies) {
        Write-ColorOutput "✅ Setup completed successfully!" "Success"
        Write-Host ""
        Write-ColorOutput "Next steps:" "Info"
        Write-Host "1. Start your application: npm run dev"
        Write-Host "2. Run PWA tests: .\run-pwa-tests.ps1"
        Write-Host "3. Check manual testing guide: manual-pwa-testing-guide.md"
    } else {
        Write-ColorOutput "❌ Setup failed" "Error"
        exit 1
    }
    exit 0
}

# Handle report flag
if ($Report) {
    Open-LatestReport
    exit 0
}

# Check prerequisites
if (-not (Test-Prerequisites)) {
    Write-ColorOutput "❌ Prerequisites not met. Run with -Setup to install dependencies." "Error"
    Write-ColorOutput "Usage: .\run-pwa-tests.ps1 -Setup" "Info"
    exit 1
}

# Get test URL
$testUrl = Get-TestUrl -Environment $Environment -CustomUrl $Url

# Run tests
$testSuccess = Start-PWATests -TestUrl $testUrl -VisibleMode $Visible

# Show results
Write-Host ""
Show-TestResults

# Show manual testing guide info
Write-Host ""
Show-ManualTestingGuide

# Final message
Write-Host ""
if ($testSuccess) {
    Write-ColorOutput "🎉 PWA testing completed! Check the reports above." "Success"
    Write-ColorOutput "Don't forget to complete the manual testing checklist!" "Info"
} else {
    Write-ColorOutput "⚠️  PWA testing completed with issues. Review the reports and fix any problems." "Warning"
}

Write-Host ""
Write-ColorOutput "For help: .\run-pwa-tests.ps1 -Help" "Info"

exit $(if ($testSuccess) { 0 } else { 1 })
