import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Перенаправляємо запит до бота
    const response = await axios.get(`${BOT_API_URL}/api/stats`, {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error fetching bot stats:', error.message);

    // Повертаємо mock дані якщо бот недоступний
    const mockStats = {
      totalProjects: 156,
      proposalsSent: 23,
      responseRate: 18.5,
      activeSearches: 3,
      dailyEarnings: 0,
      weeklyEarnings: 450,
      isRunning: false,
      lastUpdate: new Date().toISOString(),
    };

    res.status(200).json(mockStats);
  }
}
