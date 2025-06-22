import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ErrorLogData {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errorId?: string;
}

/**
 * @swagger
 * /api/errors:
 *   post:
 *     tags:
 *       - errors
 *     summary: Логирование ошибок приложения
 *     description: Эндпоинт для сбора и логирования ошибок клиентского приложения
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - timestamp
 *               - userAgent
 *               - url
 *             properties:
 *               message:
 *                 type: string
 *                 description: Сообщение об ошибке
 *                 example: "Cannot read property 'map' of undefined"
 *               stack:
 *                 type: string
 *                 description: Stack trace ошибки
 *                 example: "TypeError: Cannot read property 'map' of undefined\n    at Component.render"
 *               componentStack:
 *                 type: string
 *                 description: React component stack trace
 *                 example: "    in Component (at App.js:10)\n    in App (at index.js:5)"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Время возникновения ошибки
 *                 example: "2024-01-15T10:30:00.000Z"
 *               userAgent:
 *                 type: string
 *                 description: User Agent браузера
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *               url:
 *                 type: string
 *                 description: URL страницы, где произошла ошибка
 *                 example: "https://example.com/dashboard"
 *               userId:
 *                 type: string
 *                 description: ID пользователя (если авторизован)
 *                 example: "user_123456"
 *               sessionId:
 *                 type: string
 *                 description: ID сессии
 *                 example: "session_789012"
 *     responses:
 *       200:
 *         description: Ошибка успешно зарегистрирована
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Error logged successfully"
 *                 errorId:
 *                   type: string
 *                   description: Уникальный ID записи об ошибке
 *                   example: "error_1642248600000_abc123"
 *       400:
 *         description: Некорректные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       405:
 *         description: Метод не разрешен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Only POST requests are accepted.'
    });
  }

  try {
    const errorData: ErrorLogData = req.body;

    // Validate required fields
    if (!errorData.message || !errorData.timestamp || !errorData.userAgent || !errorData.url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: message, timestamp, userAgent, url'
      });
    }

    // Generate unique error ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare log entry
    const logEntry = {
      id: errorId,
      ...errorData,
      serverTimestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      headers: {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer,
        'accept-language': req.headers['accept-language']
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error Logged:', {
        id: errorId,
        message: errorData.message,
        url: errorData.url,
        timestamp: errorData.timestamp
      });
    }

    // In production, you would typically:
    // 1. Send to external logging service (Sentry, LogRocket, etc.)
    // 2. Store in database
    // 3. Send alerts for critical errors

    if (process.env.NODE_ENV === 'production') {
      await logToFile(logEntry);

      // Example: Send to external service
      // await sendToExternalService(logEntry);

      // Example: Store in database
      // await storeInDatabase(logEntry);

      // Example: Send alert for critical errors
      // if (isCriticalError(errorData)) {
      //   await sendAlert(logEntry);
      // }
    }

    res.status(200).json({
      success: true,
      message: 'Error logged successfully',
      errorId
    });

  } catch (error) {
    console.error('Error in error logging endpoint:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error while logging error'
    });
  }
}

// Helper function to log errors to file
async function logToFile(logEntry: any): Promise<void> {
  try {
    const logsDir = path.join(process.cwd(), 'logs');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Failed to write error log to file:', error);
  }
}

// Helper function to determine if error is critical
function isCriticalError(errorData: ErrorLogData): boolean {
  const criticalKeywords = [
    'ChunkLoadError',
    'Network Error',
    'Failed to fetch',
    'Script error',
    'SecurityError'
  ];

  return criticalKeywords.some(keyword =>
    errorData.message.includes(keyword) ||
    (errorData.stack && errorData.stack.includes(keyword))
  );
}

// Example function to send to external service
// async function sendToExternalService(logEntry: any): Promise<void> {
//   try {
//     // Example: Send to Sentry
//     // Sentry.captureException(new Error(logEntry.message), {
//     //   extra: logEntry
//     // });
//
//     // Example: Send to custom webhook
//     // await fetch(process.env.ERROR_WEBHOOK_URL, {
//     //   method: 'POST',
//     //   headers: { 'Content-Type': 'application/json' },
//     //   body: JSON.stringify(logEntry)
//     // });
//   } catch (error) {
//     console.error('Failed to send error to external service:', error);
//   }
// }

// Example function to store in database
// async function storeInDatabase(logEntry: any): Promise<void> {
//   try {
//     // Example: Store in MongoDB
//     // await db.collection('errors').insertOne(logEntry);
//
//     // Example: Store in PostgreSQL
//     // await pool.query(
//     //   'INSERT INTO error_logs (id, message, stack, url, timestamp, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
//     //   [logEntry.id, logEntry.message, logEntry.stack, logEntry.url, logEntry.timestamp, logEntry.userAgent]
//     // );
//   } catch (error) {
//     console.error('Failed to store error in database:', error);
//   }
// }
