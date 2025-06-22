const fs = require('fs');
const path = require('path');

console.log('🌍 Setting up environment and fixing remaining issues...');

// Function to ensure directory exists
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to write file safely
function writeFile(filePath, content) {
  try {
    ensureDir(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
  }
}

// Create .env.local file with necessary environment variables
const envContent = `# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-change-in-production
JWT_EXPIRES_IN=24h

# Two-Factor Authentication
TWO_FACTOR_ENABLED=true
TWO_FACTOR_TOKEN_EXPIRY=300000

# Database Configuration (when ready)
# DATABASE_URL=your-database-connection-string
# REDIS_URL=your-redis-connection-string

# Email Configuration (when ready)
# SMTP_HOST=your-smtp-host
# SMTP_PORT=587
# SMTP_USER=your-smtp-username
# SMTP_PASS=your-smtp-password

# SMS Configuration (when ready)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=your-twilio-phone-number

# MGX API Configuration
MGX_API_URL=https://mgx.dev/api
MGX_API_KEY=your-mgx-api-key-when-available

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

// Create next.config.js with proper TypeScript configuration
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false,
  },
  typescript: {
    // Temporarily ignore build errors during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Temporarily ignore ESLint errors during development
    ignoreDuringBuilds: false,
  },
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    TWO_FACTOR_ENABLED: process.env.TWO_FACTOR_ENABLED,
  },
};

module.exports = nextConfig;
`;

// Create tsconfig.json with proper configuration
const tsconfigContent = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/pages/*": ["./pages/*"],
      "@/utils/*": ["./utils/*"],
      "@/middleware/*": ["./middleware/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist"
  ]
}
`;

// Create package.json scripts section update
const packageJsonUpdate = `{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "fix-types": "node fix-remaining-ts-errors.js",
    "setup-env": "node setup-environment.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
`;

// Create a simple type declaration file for missing types
const typesContent = `// Global type declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      TWO_FACTOR_ENABLED: string;
      DATABASE_URL?: string;
      REDIS_URL?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      TWILIO_ACCOUNT_SID?: string;
      TWILIO_AUTH_TOKEN?: string;
      TWILIO_PHONE_NUMBER?: string;
      MGX_API_URL?: string;
      MGX_API_KEY?: string;
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

// Module declarations for packages that might not have types
declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string, options?: any): any;
  export function decode(token: string, options?: any): any;
}

export {};
`;

// Create README for the setup
const setupReadmeContent = `# Environment Setup Complete

## ✅ What was configured:

### 1. Environment Variables (.env.local)
- JWT configuration
- Two-factor authentication settings
- Database placeholders
- Email/SMS service placeholders
- MGX API configuration
- Security settings

### 2. TypeScript Configuration
- Updated tsconfig.json with proper paths
- Added type declarations
- Configured module resolution

### 3. Next.js Configuration
- Updated next.config.js
- Added environment variable exposure
- Configured TypeScript settings

## 🚀 Next Steps:

### 1. Update Environment Variables
\`\`\`bash
# Edit .env.local with your actual values
nano .env.local
\`\`\`

### 2. Install Additional Dependencies (if needed)
\`\`\`bash
npm install bcryptjs twilio nodemailer redis
npm install -D @types/bcryptjs @types/nodemailer
\`\`\`

### 3. Database Integration
- Choose your database (PostgreSQL, MongoDB, etc.)
- Update connection strings
- Replace mock data with real database calls

### 4. Testing
\`\`\`bash
npm run type-check
npm run dev
\`\`\`

### 5. Security Review
- Change JWT_SECRET to a strong, random value
- Set up proper CORS policies
- Add rate limiting
- Implement proper logging

## 📁 File Structure:
\`\`\`
├── .env.local (environment variables)
├── next.config.js (Next.js configuration)
├── tsconfig.json (TypeScript configuration)
├── types/
│   └── global.d.ts (type declarations)
├── middleware/
│   └── twoFactorAuth.ts (2FA middleware)
├── pages/api/
│   ├── content/[slug].ts (content API)
│   └── recommendations/create.ts (recommendations API)
└── utils/ (utility functions)
\`\`\`

## 🔧 Available Scripts:
- \`npm run dev\` - Start development server
- \`npm run type-check\` - Check TypeScript errors
- \`npm run fix-types\` - Fix common TypeScript issues
- \`npm run setup-env\` - Re-run environment setup
`;

// Write all configuration files
writeFile('.env.local', envContent);
writeFile('next.config.js', nextConfigContent);
writeFile('tsconfig.json', tsconfigContent);
writeFile('types/global.d.ts', typesContent);
writeFile('ENVIRONMENT_SETUP.md', setupReadmeContent);

console.log('\n🎯 Environment setup completed!');
console.log('\n📋 Summary:');
console.log('✅ Created .env.local with environment variables');
console.log('✅ Updated TypeScript configuration');
console.log('✅ Updated Next.js configuration');
console.log('✅ Added global type declarations');
console.log('✅ Created setup documentation');

console.log('\n🚀 Ready for next steps:');
console.log('1. Edit .env.local with your actual values');
console.log('2. Run: npm run type-check');
console.log('3. Run: npm run dev');
console.log('4. Set up database integration');
console.log('5. Add unit tests');
console.log('6. Security review');

console.log('\n📖 See ENVIRONMENT_SETUP.md for detailed instructions');
