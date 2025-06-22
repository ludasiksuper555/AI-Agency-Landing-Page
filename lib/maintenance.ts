import { NextRequest } from 'next/server';

/**
 * Maintenance mode utilities
 */

interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  estimatedDuration?: string;
  allowedIPs?: string[];
  allowedUserAgents?: string[];
  allowedPaths?: string[];
  bypassSecret?: string;
  startTime?: Date;
  endTime?: Date;
  contactInfo?: string;
  redirectUrl?: string;
}

interface MaintenanceStatus {
  isActive: boolean;
  message: string;
  estimatedDuration?: string;
  startTime?: Date;
  endTime?: Date;
  timeRemaining?: number; // in milliseconds
}

/**
 * Default maintenance configuration
 */
const DEFAULT_CONFIG: MaintenanceConfig = {
  enabled: false,
  message: 'We are currently performing scheduled maintenance. Please check back soon.',
  estimatedDuration: 'approximately 30 minutes',
  allowedIPs: [],
  allowedUserAgents: [],
  allowedPaths: [
    '/api/health',
    '/api/status',
    '/maintenance',
    '/robots.txt',
    '/favicon.ico',
    '/.well-known/',
  ],
  contactInfo: 'For urgent matters, please contact support.',
};

/**
 * Get maintenance configuration from environment variables
 */
export function getMaintenanceConfig(): MaintenanceConfig {
  const config: MaintenanceConfig = { ...DEFAULT_CONFIG };

  // Check if maintenance mode is enabled
  config.enabled = process.env.MAINTENANCE_MODE === 'true';

  // Custom message
  if (process.env.MAINTENANCE_MESSAGE) {
    config.message = process.env.MAINTENANCE_MESSAGE;
  }

  // Estimated duration
  if (process.env.MAINTENANCE_DURATION) {
    config.estimatedDuration = process.env.MAINTENANCE_DURATION;
  }

  // Allowed IPs
  if (process.env.MAINTENANCE_ALLOWED_IPS) {
    config.allowedIPs = process.env.MAINTENANCE_ALLOWED_IPS.split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);
  }

  // Allowed user agents
  if (process.env.MAINTENANCE_ALLOWED_USER_AGENTS) {
    config.allowedUserAgents = process.env.MAINTENANCE_ALLOWED_USER_AGENTS.split(',')
      .map(ua => ua.trim())
      .filter(ua => ua.length > 0);
  }

  // Additional allowed paths
  if (process.env.MAINTENANCE_ALLOWED_PATHS) {
    const additionalPaths = process.env.MAINTENANCE_ALLOWED_PATHS.split(',')
      .map(path => path.trim())
      .filter(path => path.length > 0);
    config.allowedPaths = [...(config.allowedPaths || []), ...additionalPaths];
  }

  // Bypass secret
  if (process.env.MAINTENANCE_BYPASS_SECRET) {
    config.bypassSecret = process.env.MAINTENANCE_BYPASS_SECRET;
  }

  // Start time
  if (process.env.MAINTENANCE_START_TIME) {
    try {
      config.startTime = new Date(process.env.MAINTENANCE_START_TIME);
    } catch (error) {
      console.warn('Invalid MAINTENANCE_START_TIME format:', process.env.MAINTENANCE_START_TIME);
    }
  }

  // End time
  if (process.env.MAINTENANCE_END_TIME) {
    try {
      config.endTime = new Date(process.env.MAINTENANCE_END_TIME);
    } catch (error) {
      console.warn('Invalid MAINTENANCE_END_TIME format:', process.env.MAINTENANCE_END_TIME);
    }
  }

  // Contact info
  if (process.env.MAINTENANCE_CONTACT_INFO) {
    config.contactInfo = process.env.MAINTENANCE_CONTACT_INFO;
  }

  // Redirect URL
  if (process.env.MAINTENANCE_REDIRECT_URL) {
    config.redirectUrl = process.env.MAINTENANCE_REDIRECT_URL;
  }

  return config;
}

/**
 * Extract IP address from request
 */
function getClientIP(req: NextRequest): string {
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  return 'unknown';
}

/**
 * Check if request should bypass maintenance mode
 */
export function shouldBypassMaintenance(req: NextRequest, config: MaintenanceConfig): boolean {
  // Check bypass secret in query params or headers
  if (config.bypassSecret) {
    const querySecret = req.nextUrl.searchParams.get('bypass');
    const headerSecret = req.headers.get('x-maintenance-bypass');

    if (querySecret === config.bypassSecret || headerSecret === config.bypassSecret) {
      return true;
    }
  }

  // Check allowed IPs
  if (config.allowedIPs && config.allowedIPs.length > 0) {
    const clientIP = getClientIP(req);
    if (config.allowedIPs.includes(clientIP)) {
      return true;
    }
  }

  // Check allowed user agents
  if (config.allowedUserAgents && config.allowedUserAgents.length > 0) {
    const userAgent = req.headers.get('user-agent') || '';
    if (config.allowedUserAgents.some(ua => userAgent.includes(ua))) {
      return true;
    }
  }

  // Check allowed paths
  if (config.allowedPaths && config.allowedPaths.length > 0) {
    const pathname = req.nextUrl.pathname;
    if (config.allowedPaths.some(path => pathname.startsWith(path))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if maintenance mode is currently active
 */
export function isMaintenanceActive(config?: MaintenanceConfig): boolean {
  const maintenanceConfig = config || getMaintenanceConfig();

  if (!maintenanceConfig.enabled) {
    return false;
  }

  const now = new Date();

  // Check if we're within the maintenance window
  if (maintenanceConfig.startTime && now < maintenanceConfig.startTime) {
    return false;
  }

  if (maintenanceConfig.endTime && now > maintenanceConfig.endTime) {
    return false;
  }

  return true;
}

/**
 * Get current maintenance status
 */
export function getMaintenanceStatus(): MaintenanceStatus {
  const config = getMaintenanceConfig();
  const isActive = isMaintenanceActive(config);

  let timeRemaining: number | undefined;
  if (isActive && config.endTime) {
    timeRemaining = Math.max(0, config.endTime.getTime() - Date.now());
  }

  return {
    isActive,
    message: config.message || DEFAULT_CONFIG.message!,
    estimatedDuration: config.estimatedDuration,
    startTime: config.startTime,
    endTime: config.endTime,
    timeRemaining,
  };
}

/**
 * Create maintenance mode response
 */
export function createMaintenanceResponse(config: MaintenanceConfig, req: NextRequest): Response {
  const status = getMaintenanceStatus();

  // If redirect URL is specified, redirect instead of showing maintenance page
  if (config.redirectUrl) {
    return Response.redirect(config.redirectUrl, 302);
  }

  // Check if request accepts JSON
  const acceptHeader = req.headers.get('accept') || '';
  const isApiRequest =
    req.nextUrl.pathname.startsWith('/api/') || acceptHeader.includes('application/json');

  if (isApiRequest) {
    // Return JSON response for API requests
    const jsonResponse = {
      error: 'Service Unavailable',
      message: status.message,
      estimatedDuration: status.estimatedDuration,
      startTime: status.startTime?.toISOString(),
      endTime: status.endTime?.toISOString(),
      timeRemaining: status.timeRemaining,
      contactInfo: config.contactInfo,
    };

    return new Response(JSON.stringify(jsonResponse), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': status.timeRemaining
          ? Math.ceil(status.timeRemaining / 1000).toString()
          : '3600',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Return HTML response for web requests
  const html = createMaintenanceHTML(status, config);

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': status.timeRemaining
        ? Math.ceil(status.timeRemaining / 1000).toString()
        : '3600',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Create maintenance mode HTML page
 */
function createMaintenanceHTML(status: MaintenanceStatus, config: MaintenanceConfig): string {
  const timeRemainingText = status.timeRemaining
    ? formatTimeRemaining(status.timeRemaining)
    : status.estimatedDuration || 'unknown';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Mode</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }

        .container {
            background: white;
            border-radius: 12px;
            padding: 3rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #2d3748;
        }

        .message {
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            color: #4a5568;
        }

        .info {
            background: #f7fafc;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }

        .info-item:last-child {
            margin-bottom: 0;
        }

        .label {
            font-weight: 600;
            color: #2d3748;
        }

        .value {
            color: #4a5568;
        }

        .contact {
            font-size: 0.9rem;
            color: #718096;
            margin-top: 1rem;
        }

        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
        }

        .refresh-btn:hover {
            background: #5a67d8;
        }

        @media (max-width: 480px) {
            .container {
                padding: 2rem;
            }

            h1 {
                font-size: 1.5rem;
            }

            .icon {
                font-size: 3rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>Maintenance Mode</h1>
        <div class="message">
            ${status.message}
        </div>

        <div class="info">
            ${
              status.estimatedDuration
                ? `
            <div class="info-item">
                <span class="label">Estimated Duration:</span>
                <span class="value">${timeRemainingText}</span>
            </div>
            `
                : ''
            }

            ${
              status.startTime
                ? `
            <div class="info-item">
                <span class="label">Started:</span>
                <span class="value">${status.startTime.toLocaleString()}</span>
            </div>
            `
                : ''
            }

            ${
              status.endTime
                ? `
            <div class="info-item">
                <span class="label">Expected End:</span>
                <span class="value">${status.endTime.toLocaleString()}</span>
            </div>
            `
                : ''
            }
        </div>

        <button class="refresh-btn" onclick="window.location.reload()">
            Refresh Page
        </button>

        ${
          config.contactInfo
            ? `
        <div class="contact">
            ${config.contactInfo}
        </div>
        `
            : ''
        }
    </div>

    ${
      status.timeRemaining
        ? `
    <script>
        // Auto-refresh when maintenance is expected to end
        setTimeout(() => {
            window.location.reload();
        }, ${status.timeRemaining});

        // Update countdown every minute
        setInterval(() => {
            window.location.reload();
        }, 60000);
    </script>
    `
        : ''
    }
</body>
</html>
  `.trim();
}

/**
 * Format time remaining in a human-readable format
 */
function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'less than a minute';
  }
}

/**
 * Middleware helper for maintenance mode
 */
export function handleMaintenanceMode(req: NextRequest): Response | null {
  const config = getMaintenanceConfig();

  if (!isMaintenanceActive(config)) {
    return null;
  }

  if (shouldBypassMaintenance(req, config)) {
    return null;
  }

  return createMaintenanceResponse(config, req);
}

/**
 * Enable maintenance mode programmatically
 */
export function enableMaintenanceMode(
  message?: string,
  duration?: number // in milliseconds
): void {
  process.env.MAINTENANCE_MODE = 'true';

  if (message) {
    process.env.MAINTENANCE_MESSAGE = message;
  }

  if (duration) {
    const endTime = new Date(Date.now() + duration);
    process.env.MAINTENANCE_END_TIME = endTime.toISOString();
  }
}

/**
 * Disable maintenance mode programmatically
 */
export function disableMaintenanceMode(): void {
  process.env.MAINTENANCE_MODE = 'false';
  delete process.env.MAINTENANCE_MESSAGE;
  delete process.env.MAINTENANCE_START_TIME;
  delete process.env.MAINTENANCE_END_TIME;
}

/**
 * Schedule maintenance mode
 */
export function scheduleMaintenanceMode(startTime: Date, endTime: Date, message?: string): void {
  process.env.MAINTENANCE_MODE = 'true';
  process.env.MAINTENANCE_START_TIME = startTime.toISOString();
  process.env.MAINTENANCE_END_TIME = endTime.toISOString();

  if (message) {
    process.env.MAINTENANCE_MESSAGE = message;
  }
}
