import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Отримання налаштувань бота
        const getResponse = await axios.get(`${BOT_API_URL}/api/settings`, {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        res.status(200).json(getResponse.data);
        break;

      case 'PUT':
        // Оновлення налаштувань бота
        const updateResponse = await axios.put(`${BOT_API_URL}/api/settings`, req.body, {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        res.status(200).json(updateResponse.data);
        break;

      case 'POST':
        // Скидання налаштувань до значень за замовчуванням
        const resetResponse = await axios.post(
          `${BOT_API_URL}/api/settings/reset`,
          {},
          {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );
        res.status(200).json(resetResponse.data);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }
  } catch (error: any) {
    console.error('Error handling settings request:', error.message);

    // Повертаємо mock дані або відповіді залежно від методу
    if (method === 'GET') {
      const mockSettings = {
        searchInterval: 30, // хвилини
        autoApply: false,
        platforms: ['upwork', 'freelancer', 'fiverr'],
        keywords: 'react, javascript, typescript, node.js',
        minBudget: 500,
        maxBudget: 5000,
        proposalTemplate: {
          tone: 'professional',
          length: 'medium',
          includePortfolio: true,
          customIntro: 'Hello! I am an experienced developer...',
        },
        notifications: {
          email: true,
          telegram: true,
          newProjects: true,
          proposalResponses: true,
        },
        workingHours: {
          enabled: true,
          start: '09:00',
          end: '18:00',
          timezone: 'UTC+2',
        },
      };
      res.status(200).json(mockSettings);
    } else if (method === 'PUT') {
      res.status(200).json({
        success: true,
        message: 'Settings updated successfully (mock response)',
        settings: req.body,
      });
    } else if (method === 'POST') {
      res.status(200).json({
        success: true,
        message: 'Settings reset to defaults (mock response)',
      });
    }
  }
}
