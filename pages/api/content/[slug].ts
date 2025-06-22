import { NextApiRequest, NextApiResponse } from 'next';
import { twoFactorAuthMiddleware } from '../../../middleware/twoFactorAuth';

interface ContentItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Mock data for development
const mockContent: ContentItem[] = [
  {
    id: '1',
    slug: 'sample-content',
    title: 'Sample Content',
    content: 'This is sample content for testing.',
    author: 'System',
    status: 'published',
    tags: ['sample', 'test'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

class ContentService {
  async getContent(slug: string): Promise<ContentItem | null> {
    try {
      const item = mockContent.find(item => item.slug === slug);
      return item || null;
    } catch (error) {
      console.error('Error getting content:', error);
      return null;
    }
  }

  async updateContent(slug: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
      const index = mockContent.findIndex(item => item.slug === slug);
      if (index === -1) return null;

      mockContent[index] = {
        ...mockContent[index],
        ...updates,
        updatedAt: new Date(),
      };

      return mockContent[index];
    } catch (error) {
      console.error('Error updating content:', error);
      return null;
    }
  }

  async deleteContent(slug: string): Promise<boolean> {
    try {
      const index = mockContent.findIndex(item => item.slug === slug);
      if (index === -1) return false;

      mockContent.splice(index, 1);
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  async createContent(
    data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ContentItem> {
    const newItem: ContentItem = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockContent.push(newItem);
    return newItem;
  }
}

const contentService = new ContentService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ContentItem>>
) {
  const { slug } = req.query;

  if (typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid slug parameter',
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        const content = await contentService.getContent(slug);
        if (!content) {
          return res.status(404).json({
            success: false,
            error: 'Content not found',
          });
        }
        return res.status(200).json({
          success: true,
          data: content,
        });

      case 'PUT':
        const updatedContent = await contentService.updateContent(slug, req.body);
        if (!updatedContent) {
          return res.status(404).json({
            success: false,
            error: 'Content not found',
          });
        }
        return res.status(200).json({
          success: true,
          data: updatedContent,
          message: 'Content updated successfully',
        });

      case 'DELETE':
        const deleted = await contentService.deleteContent(slug);
        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'Content not found',
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Content deleted successfully',
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
