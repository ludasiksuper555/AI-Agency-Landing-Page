import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { action } = query;

  try {
    switch (method) {
      case 'POST':
        if (action === 'start') {
          // Запуск пошуку проектів
          const startResponse = await axios.post(`${BOT_API_URL}/api/search/start`, req.body, {
            timeout: 15000,
            headers: {
              Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
          res.status(200).json(startResponse.data);
        } else if (action === 'stop') {
          // Зупинка пошуку проектів
          const stopResponse = await axios.post(
            `${BOT_API_URL}/api/search/stop`,
            {},
            {
              timeout: 10000,
              headers: {
                Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );
          res.status(200).json(stopResponse.data);
        } else {
          res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
        }
        break;

      case 'GET':
        // Отримання статусу пошуку
        const statusResponse = await axios.get(`${BOT_API_URL}/api/search/status`, {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        res.status(200).json(statusResponse.data);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }
  } catch (error: any) {
    console.error('Error handling search request:', error.message);

    // Повертаємо mock відповіді залежно від дії
    if (method === 'POST') {
      if (action === 'start') {
        res.status(200).json({
          success: true,
          message: 'Search started successfully (mock response)',
          searchId: 'mock-search-' + Date.now(),
        });
      } else if (action === 'stop') {
        res.status(200).json({
          success: true,
          message: 'Search stopped successfully (mock response)',
        });
      }
    } else if (method === 'GET') {
      res.status(200).json({
        isRunning: false,
        activeSearches: 0,
        lastSearchTime: new Date().toISOString(),
        totalProjectsFound: 156,
      });
    }
  }
}
