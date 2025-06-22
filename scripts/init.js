#!/usr/bin/env node

/**
 * Project Initialization Script (JavaScript version)
 * Sets up all project management systems and generates initial reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

function createDirectories() {
  const dirs = [
    'reports',

    'docs/generated',
    'lib/mcp/servers',
    'lib/reporting/templates',
    'lib/documentation/templates',
    'lib/metrics/templates',
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Add new scripts
  const newScripts = {
    'project:init': 'node scripts/init.js',
    'project:status': 'ts-node scripts/initialize-project.ts',
    'docs:generate':
      "ts-node -e \"import { autoDocGenerator } from './lib/documentation/autoDocGenerator'; autoDocGenerator.generateProjectDocumentation().then(() => console.log('Documentation generated'))\"",
    'metrics:generate':
      "ts-node -e \"import { qualityMetrics } from './lib/metrics/qualityMetrics'; qualityMetrics.generateMetricsReport().then(r => { qualityMetrics.generateQualityDashboard(r); console.log('Metrics generated'); })\"",
    'report:daily':
      'ts-node -e "import { dailyReporting } from \'./lib/reporting/dailyReports\'; console.log(JSON.stringify(dailyReporting.generateDailyReport(), null, 2))"',
  };

  packageJson.scripts = { ...packageJson.scripts, ...newScripts };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('📦 Updated package.json with new scripts');
}

function createGitIgnoreEntries() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const newEntries = [
    '',
    '# Project Management System',

    'quality-dashboard.html',
    'lib/mcp/servers/*.log',
    'docs/generated/README.md',
  ];

  if (fs.existsSync(gitignorePath)) {
    const currentContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!currentContent.includes('# Project Management System')) {
      fs.appendFileSync(gitignorePath, newEntries.join('\n'));
      console.log('📝 Updated .gitignore with project management entries');
    }
  }
}

async function initializeProject() {
  console.log('🚀 Initializing project according to recommendations...');

  try {
    // Create necessary directories
    createDirectories();

    // Update package.json with new scripts
    updatePackageJson();

    // Update .gitignore
    createGitIgnoreEntries();

    // Install missing dependencies
    console.log('📦 Installing missing dependencies...');
    runCommand('npm install --save-dev ts-node @types/node', 'Installing TypeScript dependencies');

    // Fix TypeScript errors first
    console.log('🔧 Checking TypeScript compilation...');
    try {
      runCommand('npm run quality:check', 'Running quality check');
    } catch (error) {
      console.log('⚠️  TypeScript errors detected - will be addressed in next steps');
    }

    // Build the project
    try {
      runCommand('npm run build', 'Building project');
    } catch (error) {
      console.log('⚠️  Build failed - will be addressed with TypeScript fixes');
    }

    console.log('\n✅ Project initialization completed!');
    console.log('\n🎯 Available commands:');
    console.log('   npm run project:status    - Show project status');
    console.log('   npm run docs:generate     - Generate documentation');
    console.log('   npm run metrics:generate  - Generate quality metrics');
    console.log('   npm run report:daily      - Generate daily report');
    console.log('   npm run quality:check     - Check code quality');

    console.log('\n📋 Next steps:');
    console.log('   1. Fix TypeScript errors: npm run quality:check');
    console.log('   2. Generate documentation: npm run docs:generate');
    console.log('   3. View project status: npm run project:status');
    console.log('   4. Generate metrics: npm run metrics:generate');
  } catch (error) {
    console.error('❌ Project initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeProject();
