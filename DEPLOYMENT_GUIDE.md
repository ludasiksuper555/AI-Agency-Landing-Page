# Enhanced Team Portfolio - Deployment Guide

This comprehensive guide covers multiple deployment strategies for the Enhanced Team Portfolio application, from simple static hosting to enterprise-grade containerized deployments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Netlify](#netlify)
  - [AWS](#aws)
  - [Docker](#docker)
  - [Kubernetes](#kubernetes)
  - [Traditional VPS](#traditional-vps)
- [Database Setup](#database-setup)
- [CDN and Asset Optimization](#cdn-and-asset-optimization)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Git repository with your code
- Domain name (optional but recommended)
- SSL certificate (handled automatically by most platforms)
- Required API keys and environment variables

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.enhanced.example .env.local
```

### 2. Configure Required Variables

Minimum required environment variables:

```env
# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication (if using Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Monitoring (recommended)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### 3. Environment-Specific Configurations

#### Development

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG_MODE=true
```

#### Staging

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
SENTRY_ENVIRONMENT=staging
```

#### Production

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
SENTRY_ENVIRONMENT=production
```

## Deployment Options

### Vercel (Recommended)

Vercel provides the best experience for Next.js applications with zero-config deployments.

#### Quick Deploy

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and deploy
   vercel login
   vercel
   ```

2. **Configure Environment Variables**

   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables from `.env.enhanced.example`

3. **Custom Domain Setup**
   ```bash
   vercel domains add yourdomain.com
   vercel domains ls
   ```

#### Advanced Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Netlify

Great alternative with excellent CI/CD integration.

#### Deploy Steps

1. **Connect Repository**

   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect your repository

2. **Build Configuration**

   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
   ```

3. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all required variables

### AWS

Enterprise-grade deployment with full control.

#### Option 1: AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize project
amplify init
amplify add hosting
amplify publish
```

#### Option 2: EC2 + Load Balancer

1. **Launch EC2 Instance**

   ```bash
   # User data script
   #!/bin/bash
   yum update -y
   curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
   yum install -y nodejs git

   # Clone and setup application
   cd /opt
   git clone https://github.com/yourusername/team-portfolio.git
   cd team-portfolio
   npm ci --production
   npm run build

   # Setup PM2
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

2. **Application Load Balancer**
   ```yaml
   # ALB Configuration
   Type: AWS::ElasticLoadBalancingV2::LoadBalancer
   Properties:
     Type: application
     Scheme: internet-facing
     SecurityGroups:
       - !Ref ALBSecurityGroup
     Subnets:
       - !Ref PublicSubnet1
       - !Ref PublicSubnet2
   ```

#### Option 3: ECS Fargate

```yaml
# docker-compose.aws.yml
version: '3.8'
services:
  app:
    image: your-registry/team-portfolio:latest
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Docker

Containerized deployment for any platform.

#### Build and Run

```bash
# Build image
docker build -f Dockerfile_enhanced -t team-portfolio .

# Run container
docker run -d \
  --name team-portfolio \
  -p 3000:3000 \
  --env-file .env.production \
  team-portfolio
```

#### Docker Compose

```bash
# Use enhanced compose file
docker-compose -f docker-compose_enhanced.yml up -d

# Scale application
docker-compose -f docker-compose_enhanced.yml up -d --scale app=3
```

#### Multi-stage Production Build

```dockerfile
# Production optimized Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes

Scalable container orchestration.

#### Deployment Manifests

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: team-portfolio
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: team-portfolio
  template:
    metadata:
      labels:
        app: team-portfolio
    spec:
      containers:
        - name: app
          image: your-registry/team-portfolio:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: team-portfolio-service
  namespace: production
spec:
  selector:
    app: team-portfolio
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: team-portfolio-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - yourdomain.com
      secretName: team-portfolio-tls
  rules:
    - host: yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: team-portfolio-service
                port:
                  number: 80
```

#### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n production
kubectl get services -n production
kubectl get ingress -n production

# Scale deployment
kubectl scale deployment team-portfolio --replicas=5 -n production
```

### Traditional VPS

Deployment on virtual private servers.

#### Setup Script

```bash
#!/bin/bash
# deploy.sh

set -e

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Setup application
cd /var/www
sudo git clone https://github.com/yourusername/team-portfolio.git
cd team-portfolio
sudo npm ci --production
sudo npm run build

# Setup PM2 ecosystem
sudo pm2 start ecosystem.config.js
sudo pm2 startup
sudo pm2 save

# Setup Nginx
sudo apt install -y nginx
sudo cp nginx.conf /etc/nginx/sites-available/team-portfolio
sudo ln -s /etc/nginx/sites-available/team-portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

echo "Deployment completed successfully!"
```

#### PM2 Ecosystem Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'team-portfolio',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024',
    },
  ],
};
```

#### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

## Database Setup

### PostgreSQL (Recommended)

#### Local Setup

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE team_portfolio;
CREATE USER portfolio_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE team_portfolio TO portfolio_user;
\q
```

#### Cloud Options

1. **AWS RDS**

   ```bash
   # Create RDS instance
   aws rds create-db-instance \
     --db-instance-identifier team-portfolio-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password SecurePassword123 \
     --allocated-storage 20
   ```

2. **Supabase** (PostgreSQL as a Service)

   - Sign up at supabase.com
   - Create new project
   - Copy connection string

3. **PlanetScale** (MySQL alternative)
   - Sign up at planetscale.com
   - Create database
   - Use connection string

### Redis Setup

```bash
# Local Redis
sudo apt install redis-server
sudo systemctl enable redis-server

# Cloud options:
# - AWS ElastiCache
# - Redis Cloud
# - Upstash
```

## CDN and Asset Optimization

### Cloudflare Setup

1. **Add Domain to Cloudflare**

   - Sign up at cloudflare.com
   - Add your domain
   - Update nameservers

2. **Optimization Settings**
   ```javascript
   // next.config.js additions
   module.exports = {
     images: {
       domains: ['cdn.yourdomain.com'],
       loader: 'cloudinary', // or 'custom'
     },
     async headers() {
       return [
         {
           source: '/_next/static/(.*)',
           headers: [
             {
               key: 'Cache-Control',
               value: 'public, max-age=31536000, immutable',
             },
           ],
         },
       ];
     },
   };
   ```

### AWS CloudFront

```yaml
# CloudFormation template
CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - DomainName: !GetAtt ALB.DNSName
          Id: ALBOrigin
          CustomOriginConfig:
            HTTPPort: 80
            HTTPSPort: 443
            OriginProtocolPolicy: https-only
      DefaultCacheBehavior:
        TargetOriginId: ALBOrigin
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
      Enabled: true
      HttpVersion: http2
      PriceClass: PriceClass_100
```

## Monitoring and Analytics

### Sentry Error Monitoring

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure
echo "NEXT_PUBLIC_SENTRY_DSN=your_dsn_here" >> .env.local
```

### Application Performance Monitoring

```javascript
// pages/_app.js additions
import { init } from '@sentry/nextjs';

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Health Checks

```javascript
// pages/api/health.js
export default function handler(req, res) {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
}
```

## Security Considerations

### Environment Variables Security

```bash
# Use secrets management
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name "team-portfolio/prod" \
  --secret-string '{"DATABASE_URL":"postgresql://..."}'

# Kubernetes secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://..." \
  --namespace=production
```

### Security Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

## Performance Optimization

### Build Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};
```

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_team_members_department ON team_members(department);
CREATE INDEX idx_team_members_position ON team_members(position);
CREATE INDEX idx_team_members_active ON team_members(is_active);
CREATE INDEX idx_team_members_search ON team_members USING gin(to_tsvector('english', name || ' ' || bio));
```

## Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Memory Issues**

   ```bash
   # Increase Node.js memory
   export NODE_OPTIONS="--max_old_space_size=4096"
   npm run build
   ```

3. **Database Connection Issues**

   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew Let's Encrypt certificate
   sudo certbot renew
   sudo systemctl reload nginx
   ```

### Debugging Tools

```bash
# Application logs
docker logs team-portfolio
pm2 logs team-portfolio

# System monitoring
top
htop
iostat
netstat -tulpn

# Database monitoring
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

### Performance Monitoring

```bash
# Load testing
npx autocannon http://localhost:3000

# Bundle analysis
npm run analyze

# Lighthouse CI
npm run lighthouse
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance optimizations applied
- [ ] Health checks working
- [ ] Error tracking configured
- [ ] Load testing completed
- [ ] Documentation updated

## Support

For deployment issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Check security group/firewall settings
6. Validate SSL certificate
7. Monitor resource usage

For additional help, create an issue in the repository with:

- Deployment platform
- Error messages
- Configuration files (sanitized)
- Steps to reproduce
