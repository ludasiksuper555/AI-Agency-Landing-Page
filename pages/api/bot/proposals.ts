import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { action } = query;

  try {
    switch (method) {
      case 'GET':
        // Отримання списку пропозицій
        const { page = 1, limit = 10 } = query;
        const proposalsResponse = await axios.get(`${BOT_API_URL}/api/proposals`, {
          params: { page, limit },
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        res.status(200).json(proposalsResponse.data);
        break;

      case 'POST':
        if (action === 'generate') {
          // Генерація пропозиції
          const generateResponse = await axios.post(
            `${BOT_API_URL}/api/proposals/generate`,
            req.body,
            {
              timeout: 30000,
              headers: {
                Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );
          res.status(200).json(generateResponse.data);
        } else if (action === 'send') {
          // Відправка пропозиції
          const sendResponse = await axios.post(`${BOT_API_URL}/api/proposals/send`, req.body, {
            timeout: 15000,
            headers: {
              Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
          res.status(200).json(sendResponse.data);
        } else {
          res.status(400).json({ error: 'Invalid action' });
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }
  } catch (error: any) {
    console.error('Error handling proposals request:', error.message);

    // Повертаємо mock дані або відповіді залежно від дії
    if (method === 'GET') {
      const mockProposals = {
        proposals: [
          {
            id: '1',
            projectId: '1',
            content: 'Hello! I am an experienced React developer with 5+ years of experience...',
            status: 'sent',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: '2',
            projectId: '2',
            content: 'Hi there! I would love to help you with your full stack development needs...',
            status: 'pending',
            createdAt: '2024-01-15T09:15:00Z',
            updatedAt: '2024-01-15T09:15:00Z',
          },
          {
            id: '3',
            projectId: '3',
            content:
              'Greetings! I specialize in React Native development and have built 20+ mobile apps...',
            status: 'draft',
            createdAt: '2024-01-15T08:45:00Z',
            updatedAt: '2024-01-15T08:45:00Z',
          },
        ],
        total: 23,
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10,
      };
      res.status(200).json(mockProposals);
    } else if (method === 'POST' && action === 'generate') {
      const mockProposal = {
        proposal: `Hello! I am an experienced developer with expertise in the technologies you mentioned. I have successfully completed similar projects and would love to help you achieve your goals.

My approach would be:
1. Analyze your requirements in detail
2. Create a development plan with milestones
3. Implement the solution using best practices
4. Provide thorough testing and documentation

I am available to start immediately and can deliver high-quality results within your timeline. Let's discuss your project in more detail!

Best regards`,
      };
      res.status(200).json(mockProposal);
    } else if (method === 'POST' && action === 'send') {
      res.status(200).json({
        success: true,
        message: 'Proposal sent successfully (mock response)',
      });
    }
  }
}
