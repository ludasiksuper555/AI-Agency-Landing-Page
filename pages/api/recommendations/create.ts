import { NextApiRequest, NextApiResponse } from 'next';

// Interfaces
interface RecommendationRequest {
  userId: string;
  type: 'performance' | 'security' | 'optimization' | 'feature';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface Recommendation {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  estimatedImpact: number;
  implementationCost: number;
}

interface ApiResponse {
  success: boolean;
  data?: Recommendation;
  error?: string;
  message?: string;
}

// Mock recommendations storage
const recommendations: Recommendation[] = [];

// Recommendation service
class RecommendationService {
  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Calculate estimated impact
  private calculateImpact(type: string, priority: string): number {
    const typeMultiplier = {
      performance: 0.8,
      security: 1.0,
      optimization: 0.6,
      feature: 0.7,
    };

    const priorityMultiplier = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 1.0,
    };

    return Math.round(
      (typeMultiplier[type as keyof typeof typeMultiplier] || 0.5) *
        (priorityMultiplier[priority as keyof typeof priorityMultiplier] || 0.5) *
        100
    );
  }

  // Calculate implementation cost
  private calculateCost(type: string, priority: string): number {
    const baseCost = {
      performance: 5,
      security: 8,
      optimization: 3,
      feature: 10,
    };

    const priorityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,
    };

    return Math.round(
      (baseCost[type as keyof typeof baseCost] || 5) *
        (priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0)
    );
  }

  // Create recommendation
  async createRecommendation(data: RecommendationRequest): Promise<Recommendation> {
    try {
      const recommendation: Recommendation = {
        id: this.generateId(),
        userId: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        status: 'pending',
        tags: data.tags || [],
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedImpact: this.calculateImpact(data.type, data.priority),
        implementationCost: this.calculateCost(data.type, data.priority),
      };

      recommendations.push(recommendation);

      // Log the recommendation creation
      console.log('Recommendation created:', recommendation.id, 'by user:', data.userId);

      return recommendation;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw new Error('Failed to create recommendation');
    }
  }

  // Validate recommendation data
  validateRecommendationData(data: any): string[] {
    const errors: string[] = [];

    if (!data.userId) errors.push('User ID is required');
    if (!data.type) errors.push('Type is required');
    if (!data.title) errors.push('Title is required');
    if (!data.description) errors.push('Description is required');
    if (!data.priority) errors.push('Priority is required');
    if (!data.category) errors.push('Category is required');

    const validTypes = ['performance', 'security', 'optimization', 'feature'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Invalid type. Must be one of: ' + validTypes.join(', '));
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority. Must be one of: ' + validPriorities.join(', '));
    }

    if (data.title && data.title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (data.description && data.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    return errors;
  }
}

const recommendationService = new RecommendationService();

// API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method ' + req.method + ' not allowed',
    });
  }

  try {
    // Validate request data
    const validationErrors = recommendationService.validateRecommendationData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: ' + validationErrors.join(', '),
      });
    }

    // Create recommendation
    const recommendation = await recommendationService.createRecommendation(req.body);

    return res.status(201).json({
      success: true,
      data: recommendation,
      message: 'Recommendation created successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
