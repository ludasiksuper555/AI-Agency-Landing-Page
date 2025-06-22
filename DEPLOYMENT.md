# 🚀 Deployment Guide

_AI Agency Landing Page - Complete Deployment Documentation_

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Netlify](#netlify)
  - [Docker](#docker)
  - [AWS](#aws)
  - [Self-Hosted](#self-hosted)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## 🌟 Overview

This guide covers all deployment options for the AI Agency Landing Page, from simple static hosting to complex multi-environment setups with CI/CD pipelines.

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Load Balancer │    │   Redis Cache   │
│   (Cloudflare)  │    │   (Nginx)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.17.0 or higher
- **npm**: 9.6.7 or higher (or yarn/pnpm)
- **Git**: Latest version
- **Docker**: 20.10+ (for containerized deployment)

### Required Accounts

- **GitHub**: For source code and CI/CD
- **Vercel/Netlify**: For hosting (choose one)
- **Clerk**: For authentication
- **Contentful**: For content management
- **Sentry**: For error monitoring
- **Google Analytics**: For analytics

## ⚙️ Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/ludasiksuper555/rules.git
cd rules
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### 4. Build and Test

```bash
# Build the application
npm run build

# Run tests
npm run test

# Start development server
npm run dev
```

## 🚀 Deployment Options

### Vercel (Recommended)

#### Why Vercel?

- ✅ Optimized for Next.js
- ✅ Automatic deployments
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Preview deployments
- ✅ Built-in analytics

#### Quick Deploy

1. **Connect Repository**

   ```bash
   vercel
   ```

2. **Configure Project**

   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**

   ```bash
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   vercel env add CLERK_SECRET_KEY
   vercel env add CONTENTFUL_SPACE_ID
   # ... add all required variables
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify

#### Quick Deploy

1. **Connect Repository**

   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**

   - Build command: `npm run build`
   - Publish directory: `out`
   - Node version: `18`

3. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all required variables from `.env.example`

### Docker

#### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CONTENTFUL_SPACE_ID
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CONTENTFUL_SPACE_ID=$CONTENTFUL_SPACE_ID

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Update deployment
docker-compose pull
docker-compose up -d
```

### AWS

#### AWS Amplify

1. **Connect Repository**

   ```bash
   npm install -g @aws-amplify/cli
   amplify init
   ```

2. **Configure Build**
   ```yaml
   # amplify.yml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### Self-Hosted

#### Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### PM2 Configuration

**ecosystem.config.js**

```javascript
module.exports = {
  apps: [
    {
      name: 'ai-agency',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/ai-agency',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/ai-agency-error.log',
      out_file: '/var/log/pm2/ai-agency-out.log',
      log_file: '/var/log/pm2/ai-agency.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
  ],
};
```

## 🔧 Environment Variables

### Production Environment

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=3000

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Content Management
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_preview_token
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_ANALYTICS_PRIVATE_KEY=your_private_key
GOOGLE_ANALYTICS_CLIENT_EMAIL=your_client_email

# Monitoring
SENTRY_DSN=https://your_dsn@sentry.io/project_id
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token

# Security
NEXTAUTH_SECRET=your_nextauth_secret
ENCRYPTION_KEY=your_encryption_key
JWT_SECRET=your_jwt_secret
```

## 🔄 CI/CD Pipeline

### GitHub Actions

The project already includes comprehensive GitHub Actions workflows:

- **Quality Checks**: ESLint, TypeScript, Prettier
- **Testing**: Unit tests, E2E tests, Coverage
- **Security**: CodeQL analysis, Dependency scanning
- **Performance**: Lighthouse audits
- **Deployment**: Automatic deployment to production

## 📊 Monitoring & Logging

### Application Monitoring

**Sentry Configuration**

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
});
```

**Health Check Endpoint**

```javascript
// pages/api/health.js
export default function handler(req, res) {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'OK',
      redis: 'OK',
      external_apis: 'OK',
    },
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
}
```

## ⚡ Performance Optimization

### Next.js Optimizations

**next.config.js**

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
  images: {
    domains: ['images.ctfassets.net'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
});
```

## 🔒 Security Considerations

### Security Headers

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Debugging Tools

```javascript
// Debug API routes
export default function handler(req, res) {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  });

  // Your handler logic
}
```

## 🔄 Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Promote previous deployment
vercel promote [deployment-url]
```

### Docker Rollback

```bash
# Tag current version
docker tag ai-agency:latest ai-agency:backup

# Rollback to previous version
docker-compose down
docker pull ai-agency:previous
docker-compose up -d
```

---

## 📞 Support

For deployment support:

- **Documentation**: [Project Documentation](./docs/)
- **GitHub Issues**: [Create an issue](https://github.com/ludasiksuper555/rules/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ludasiksuper555/rules/discussions)

---

_Last updated: January 2024_
