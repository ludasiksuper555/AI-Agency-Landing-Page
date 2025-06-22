module.exports = {
  apps: [
    {
      name: 'techmoneybot',
      script: 'bot.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true,
        ignore_watch: ['node_modules', 'logs', 'tests', '.git']
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      cron_restart: '0 2 * * *', // Restart daily at 2 AM

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // Advanced PM2 features
      node_args: '--max-old-space-size=1024',

      // Environment specific configurations
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        instances: 'max',
        exec_mode: 'cluster'
      }
    },

    // Separate process for cron jobs (optional)
    {
      name: 'techmoneybot-cron',
      script: 'scripts/cron-worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'cron'
      },
      cron_restart: '0 3 * * *', // Restart daily at 3 AM
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 10000
    },

    // Analytics worker (optional)
    {
      name: 'techmoneybot-analytics',
      script: 'scripts/analytics-worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'analytics'
      },
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 5000
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/techmoneybot.git',
      path: '/var/www/techmoneybot',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },

    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/techmoneybot.git',
      path: '/var/www/techmoneybot-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
