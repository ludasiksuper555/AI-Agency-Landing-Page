import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint for handling Content Security Policy (CSP) violation reports
 * This endpoint receives and processes CSP violation reports from browsers
 */

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    if (!req.body || !req.body['csp-report']) {
      return res.status(400).json({ error: 'Invalid CSP report format' });
    }

    const report: CSPViolationReport = req.body;
    const violation = report['csp-report'];

    // Log the violation
    console.warn('[CSP Violation]', {
      timestamp: new Date().toISOString(),
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    // In production, you might want to:
    // 1. Store violations in a database
    // 2. Send alerts for critical violations
    // 3. Aggregate violation statistics
    // 4. Send to external monitoring service

    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external monitoring service
      if (process.env.CSP_VIOLATION_WEBHOOK) {
        try {
          await fetch(process.env.CSP_VIOLATION_WEBHOOK, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.CSP_WEBHOOK_TOKEN}`,
            },
            body: JSON.stringify({
              type: 'csp_violation',
              timestamp: new Date().toISOString(),
              violation,
              metadata: {
                userAgent: req.headers['user-agent'],
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                referer: req.headers.referer,
              },
            }),
          });
        } catch (error) {
          console.error('[CSP Report] Failed to send to webhook:', error);
        }
      }

      // Check if this is a critical violation that needs immediate attention
      const criticalDirectives = ['script-src', 'object-src', 'base-uri', 'frame-ancestors'];

      const isCritical = criticalDirectives.some(directive =>
        violation['violated-directive'].includes(directive)
      );

      if (isCritical) {
        console.error('[CSP Critical Violation]', {
          directive: violation['violated-directive'],
          blockedUri: violation['blocked-uri'],
          documentUri: violation['document-uri'],
        });

        // Send immediate alert (email, Slack, etc.)
        // This is where you'd integrate with your alerting system
      }
    }

    // Respond with 204 No Content (standard for CSP reports)
    res.status(204).end();
  } catch (error) {
    console.error('[CSP Report] Error processing violation report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Configuration for this API route
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
