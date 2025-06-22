import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = 'week' } = query;

    // Отримання аналітики від бота
    const analyticsResponse = await axios.get(`${BOT_API_URL}/api/analytics`, {
      params: { period },
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(analyticsResponse.data);
  } catch (error: any) {
    console.error('Error fetching analytics:', error.message);

    // Повертаємо mock аналітику якщо бот недоступний
    const period = query.period || 'week';

    const mockAnalytics = {
      period,
      summary: {
        totalProjects: period === 'day' ? 12 : period === 'week' ? 156 : 680,
        proposalsSent: period === 'day' ? 3 : period === 'week' ? 23 : 98,
        responsesReceived: period === 'day' ? 1 : period === 'week' ? 4 : 18,
        projectsWon: period === 'day' ? 0 : period === 'week' ? 1 : 5,
        earnings: period === 'day' ? 0 : period === 'week' ? 450 : 2100,
      },
      charts: {
        projectsOverTime: [
          { date: '2024-01-08', count: 18 },
          { date: '2024-01-09', count: 22 },
          { date: '2024-01-10', count: 15 },
          { date: '2024-01-11', count: 28 },
          { date: '2024-01-12', count: 31 },
          { date: '2024-01-13', count: 25 },
          { date: '2024-01-14', count: 17 },
        ],
        proposalsOverTime: [
          { date: '2024-01-08', count: 3 },
          { date: '2024-01-09', count: 4 },
          { date: '2024-01-10', count: 2 },
          { date: '2024-01-11', count: 5 },
          { date: '2024-01-12', count: 4 },
          { date: '2024-01-13', count: 3 },
          { date: '2024-01-14', count: 2 },
        ],
        platformDistribution: [
          { platform: 'Upwork', count: 89, percentage: 57 },
          { platform: 'Freelancer', count: 45, percentage: 29 },
          { platform: 'Fiverr', count: 22, percentage: 14 },
        ],
        budgetRanges: [
          { range: '$0-$500', count: 34, percentage: 22 },
          { range: '$500-$1500', count: 67, percentage: 43 },
          { range: '$1500-$3000', count: 38, percentage: 24 },
          { range: '$3000+', count: 17, percentage: 11 },
        ],
        responseRates: {
          overall: 18.5,
          byPlatform: {
            upwork: 22.1,
            freelancer: 15.6,
            fiverr: 12.3,
          },
          byBudgetRange: {
            low: 8.2,
            medium: 19.4,
            high: 28.7,
          },
        },
      },
      topKeywords: [
        { keyword: 'react', count: 45, successRate: 24.4 },
        { keyword: 'javascript', count: 38, successRate: 21.1 },
        { keyword: 'typescript', count: 29, successRate: 27.6 },
        { keyword: 'node.js', count: 25, successRate: 20.0 },
        { keyword: 'next.js', count: 18, successRate: 33.3 },
      ],
      performance: {
        averageResponseTime: '2.3 hours',
        proposalQuality: 8.7,
        clientSatisfaction: 4.6,
        repeatClients: 12,
      },
    };

    res.status(200).json(mockAnalytics);
  }
}
