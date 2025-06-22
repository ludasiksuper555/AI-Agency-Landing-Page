import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          // Отримання деталей конкретного проекту
          const projectResponse = await axios.get(`${BOT_API_URL}/api/projects/${id}`, {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
          res.status(200).json(projectResponse.data);
        } else {
          // Отримання списку проектів
          const { page = 1, limit = 10 } = query;
          const projectsResponse = await axios.get(`${BOT_API_URL}/api/projects`, {
            params: { page, limit },
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
          res.status(200).json(projectsResponse.data);
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }
  } catch (error: any) {
    console.error('Error handling projects request:', error.message);

    // Повертаємо mock дані якщо бот недоступний
    if (id) {
      const mockProject = {
        id: id,
        title: 'React Developer Needed for E-commerce Platform',
        platform: 'Upwork',
        budget: '$2000-$5000',
        description:
          'Looking for an experienced React developer to build a modern e-commerce platform with Next.js and TypeScript.',
        postedAt: '2024-01-15T10:30:00Z',
        status: 'active',
        clientRating: 4.8,
      };
      res.status(200).json(mockProject);
    } else {
      const mockProjects = {
        projects: [
          {
            id: '1',
            title: 'React Developer Needed',
            platform: 'Upwork',
            budget: '$2000-$5000',
            description: 'Looking for React developer...',
            postedAt: '2024-01-15T10:30:00Z',
            status: 'active',
            clientRating: 4.8,
          },
          {
            id: '2',
            title: 'Full Stack Developer',
            platform: 'Freelancer',
            budget: '$1500-$3000',
            description: 'Need full stack developer...',
            postedAt: '2024-01-15T09:15:00Z',
            status: 'applied',
            clientRating: 4.5,
          },
          {
            id: '3',
            title: 'Mobile App Development',
            platform: 'Fiverr',
            budget: '$3000-$7000',
            description: 'React Native app needed...',
            postedAt: '2024-01-15T08:45:00Z',
            status: 'new',
            clientRating: 4.9,
          },
        ],
        total: 156,
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10,
      };
      res.status(200).json(mockProjects);
    }
  }
}
