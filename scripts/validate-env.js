#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates required environment variables for the application
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Required environment variables by environment
const REQUIRED_VARS = {
  development: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_SITE_URL'],
  production: [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'SENTRY_DSN',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  ],
  test: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
};

// Optional but recommended variables
const RECOMMENDED_VARS = [
  'CONTENTFUL_SPACE_ID',
  'CONTENTFUL_ACCESS_TOKEN',
  'MGX_API_KEY',
  'GITHUB_CLIENT_ID',
  'AWS_ACCESS_KEY_ID',
  'RAG_API_KEY',
];

// Security-sensitive variables that should not be empty
const SECURITY_VARS = [
  'CLERK_SECRET_KEY',
  'SENTRY_DSN',
  'MGX_API_KEY',
  'GITHUB_CLIENT_SECRET',
  'AWS_SECRET_ACCESS_KEY',
  'RAG_API_KEY',
];

class EnvValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Load environment variables from .env files
   */
  loadEnvFiles() {
    const envFiles = ['.env.local', `.env.${this.environment}`, '.env'];

    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        console.log(chalk.blue(`📄 Loading ${envFile}`));
        require('dotenv').config({ path: envPath });
      }
    }
  }

  /**
   * Validate required environment variables
   */
  validateRequired() {
    const required = REQUIRED_VARS[this.environment] || REQUIRED_VARS.development;

    console.log(
      chalk.yellow(`\n🔍 Validating required variables for ${this.environment} environment...`)
    );

    for (const varName of required) {
      const value = process.env[varName];

      if (!value) {
        this.errors.push(`❌ Missing required variable: ${varName}`);
      } else if (value.includes('your_') || value.includes('example')) {
        this.errors.push(`❌ Variable ${varName} contains placeholder value: ${value}`);
      } else {
        console.log(chalk.green(`✅ ${varName}: Set`));
      }
    }
  }

  /**
   * Validate recommended environment variables
   */
  validateRecommended() {
    console.log(chalk.yellow('\n🔍 Checking recommended variables...'));

    for (const varName of RECOMMENDED_VARS) {
      const value = process.env[varName];

      if (!value) {
        this.warnings.push(`⚠️  Recommended variable not set: ${varName}`);
      } else if (value.includes('your_') || value.includes('example')) {
        this.warnings.push(`⚠️  Variable ${varName} contains placeholder value`);
      } else {
        console.log(chalk.green(`✅ ${varName}: Set`));
      }
    }
  }

  /**
   * Validate security-sensitive variables
   */
  validateSecurity() {
    console.log(chalk.yellow('\n🔒 Checking security variables...'));

    for (const varName of SECURITY_VARS) {
      const value = process.env[varName];

      if (value) {
        // Check for weak values
        if (value.length < 10) {
          this.warnings.push(`⚠️  Security variable ${varName} seems too short`);
        }

        if (value.includes('test') || value.includes('demo') || value.includes('example')) {
          this.errors.push(`❌ Security variable ${varName} contains unsafe test value`);
        }

        console.log(chalk.green(`✅ ${varName}: Set and validated`));
      }
    }
  }

  /**
   * Validate URL formats
   */
  validateUrls() {
    console.log(chalk.yellow('\n🌐 Validating URL formats...'));

    const urlVars = ['NEXT_PUBLIC_SITE_URL', 'SENTRY_DSN', 'MGX_ENDPOINT', 'RAG_API_ENDPOINT'];

    for (const varName of urlVars) {
      const value = process.env[varName];

      if (value) {
        try {
          new URL(value);
          console.log(chalk.green(`✅ ${varName}: Valid URL`));
        } catch (error) {
          this.errors.push(`❌ Invalid URL format for ${varName}: ${value}`);
        }
      }
    }
  }

  /**
   * Check for common configuration issues
   */
  validateConfiguration() {
    console.log(chalk.yellow('\n⚙️  Checking configuration...'));

    // Check Clerk configuration
    const clerkPublic = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecret = process.env.CLERK_SECRET_KEY;

    if (clerkPublic && clerkSecret) {
      if (clerkPublic.startsWith('pk_test_') && this.environment === 'production') {
        this.warnings.push('⚠️  Using Clerk test keys in production environment');
      }
      console.log(chalk.green('✅ Clerk configuration: Valid'));
    }

    // Check environment consistency
    if (this.environment === 'production') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (siteUrl && (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))) {
        this.errors.push('❌ Production environment using localhost URL');
      }
    }
  }

  /**
   * Generate .env.example file
   */
  generateExample() {
    console.log(chalk.yellow('\n📝 Checking .env.example file...'));

    const examplePath = path.join(process.cwd(), '.env.example');

    if (!fs.existsSync(examplePath)) {
      this.warnings.push('⚠️  .env.example file not found');
      return;
    }

    const exampleContent = fs.readFileSync(examplePath, 'utf8');
    const allVars = [...new Set([...Object.values(REQUIRED_VARS).flat(), ...RECOMMENDED_VARS])];

    for (const varName of allVars) {
      if (!exampleContent.includes(varName)) {
        this.warnings.push(`⚠️  Variable ${varName} missing from .env.example`);
      }
    }

    console.log(chalk.green('✅ .env.example file checked'));
  }

  /**
   * Run all validations
   */
  validate() {
    console.log(chalk.blue('🔍 Environment Variables Validation\n'));
    console.log(chalk.gray(`Environment: ${this.environment}`));
    console.log(chalk.gray(`Working Directory: ${process.cwd()}\n`));

    try {
      // Load environment files
      this.loadEnvFiles();

      // Run validations
      this.validateRequired();
      this.validateRecommended();
      this.validateSecurity();
      this.validateUrls();
      this.validateConfiguration();
      this.generateExample();

      // Report results
      this.reportResults();
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log(chalk.blue('\n📊 Validation Results\n'));

    // Show errors
    if (this.errors.length > 0) {
      console.log(chalk.red('❌ Errors:'));
      this.errors.forEach(error => console.log(`  ${error}`));
      console.log('');
    }

    // Show warnings
    if (this.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      this.warnings.forEach(warning => console.log(`  ${warning}`));
      console.log('');
    }

    // Summary
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('🎉 All environment variables are properly configured!'));
    } else if (this.errors.length === 0) {
      console.log(chalk.yellow(`✅ Configuration valid with ${this.warnings.length} warnings`));
    } else {
      console.log(
        chalk.red(
          `❌ Configuration invalid: ${this.errors.length} errors, ${this.warnings.length} warnings`
        )
      );
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  // Install dotenv if not available
  try {
    require('dotenv');
  } catch (error) {
    console.log(chalk.yellow('Installing dotenv...'));
    require('child_process').execSync('npm install dotenv', { stdio: 'inherit' });
  }

  const validator = new EnvValidator();
  validator.validate();
}

module.exports = EnvValidator;
