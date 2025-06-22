import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Перевірка статусу бота
    const statusResponse = await axios.get(`${BOT_API_URL}/api/status`, {
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(statusResponse.data);
  } catch (error: any) {
    console.error('Error checking bot status:', error.message);

    // Повертаємо mock статус якщо бот недоступний
    const mockStatus = {
      isRunning: false,
      uptime: 0,
      lastActivity: new Date().toISOString(),
      version: '1.0.0',
      environment: 'development',
      health: {
        database: 'disconnected',
        redis: 'disconnected',
        telegram: 'disconnected',
        apis: {
          upwork: 'unknown',
          freelancer: 'unknown',
          fiverr: 'unknown',
        },
      },
      performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        requestsPerMinute: 0,
      },
    };

    res.status(200).json(mockStatus);
  }
}
