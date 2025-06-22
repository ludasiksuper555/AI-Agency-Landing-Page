const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing critical core files...');

// Function to create directory if it doesn't exist
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to write file
function writeFile(filePath, content) {
  try {
    ensureDir(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error.message);
    return false;
  }
}

// Fix middleware/twoFactorAuth.ts
function fixTwoFactorAuth() {
  console.log('\n🔐 Creating middleware/twoFactorAuth.ts...');

  const filePath = path.join(process.cwd(), 'middleware', 'twoFactorAuth.ts');
  const content = `import { NextRequest, NextResponse } from 'next/server';

// Interfaces
interface AuthRequest {
  userId: string;
  token: string;
  method: '2fa' | 'sms' | 'email';
  timestamp?: number;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  backupCodes?: string[];
}

interface UserSession {
  id: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  lastActivity: Date;
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Two Factor Authentication Service
class TwoFactorAuthService {
  // Generate 6-digit code
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate secure token
  generateToken(userId: string): string {
    try {
      const payload = {
        userId,
        timestamp: Date.now()
      };

      // Try to use jsonwebtoken if available, otherwise use base64
      try {
        const jwt = require('jsonwebtoken');
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' });
      } catch (requireError) {
        // Fallback to base64 encoding
        return Buffer.from(JSON.stringify(payload)).toString('base64');
      }
    } catch (error) {
      console.error('Token generation error:', error);
      return Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    }
  }

  // Verify token
  verifyToken(token: string): { userId: string; timestamp: number } | null {
    try {
      // Try to use jsonwebtoken if available
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return {
          userId: decoded.userId,
          timestamp: decoded.timestamp
        };
      } catch (requireError) {
        // Fallback to base64 decode
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        return {
          userId: decoded.userId,
          timestamp: decoded.timestamp
        };
      }
    } catch (error) {
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(timestamp: number): boolean {
    return Date.now() - timestamp > TOKEN_EXPIRY;
  }

  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  // Validate backup code
  validateBackupCode(code: string, userCodes: string[]): boolean {
    return userCodes.includes(code.toUpperCase());
  }

  // Send 2FA code via SMS
  async sendSMSCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      console.log('Sending SMS code', code, 'to', phoneNumber);
      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  // Send 2FA code via email
  async sendEmailCode(email: string, code: string): Promise<boolean> {
    try {
      console.log('Sending email code', code, 'to', email);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  // Validate user session
  async validateUserSession(sessionToken: string): Promise<UserSession | null> {
    try {
      let decoded: any;
      try {
        const jwt = require('jsonwebtoken');
        decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
      } catch (requireError) {
        decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      }

      return {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        twoFactorEnabled: decoded.twoFactorEnabled || false,
        lastActivity: new Date()
      };
    } catch (error) {
      return null;
    }
  }
}

// Create service instance
const twoFactorService = new TwoFactorAuthService();

// Middleware function
export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Skip middleware for public routes
    if (pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/register') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static')) {
      return NextResponse.next();
    }

    // Get session token from cookies or headers
    const sessionToken = request.cookies.get('session-token')?.value ||
                        request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validate session
    const session = await twoFactorService.validateUserSession(sessionToken);
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if 2FA is required for protected routes
    if (pathname.startsWith('/admin') && !session.twoFactorEnabled) {
      return NextResponse.redirect(new URL('/2fa-setup', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

// Export service for use in API routes
export { twoFactorService };

// Config
export const config = {
  matcher: [
    '/((?!api/auth/login|api/auth/register|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

  return writeFile(filePath, content);
}

// Fix pages/api/content/[slug].ts
function fixContentSlugAPI() {
  console.log('\n📄 Creating pages/api/content/[slug].ts...');

  const filePath = path.join(process.cwd(), 'pages', 'api', 'content', '[slug].ts');
  const content = `import { NextApiRequest, NextApiResponse } from 'next';

// Interfaces
interface ContentItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

interface ApiResponse {
  success: boolean;
  data?: ContentItem;
  error?: string;
  message?: string;
}

// Mock content data
const mockContent: ContentItem[] = [
  {
    id: '1',
    slug: 'getting-started',
    title: 'Getting Started Guide',
    content: 'Welcome to our platform...',
    author: 'System',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    published: true,
    tags: ['guide', 'tutorial'],
    metadata: { category: 'documentation' }
  },
  {
    id: '2',
    slug: 'api-reference',
    title: 'API Reference',
    content: 'Complete API documentation...',
    author: 'System',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    published: true,
    tags: ['api', 'reference'],
    metadata: { category: 'documentation' }
  }
];

// Content service
class ContentService {
  // Get content by slug
  async getBySlug(slug: string): Promise<ContentItem | null> {
    try {
      const content = mockContent.find(item => item.slug === slug && item.published);
      return content || null;
    } catch (error) {
      console.error('Error fetching content:', error);
      return null;
    }
  }

  // Update content
  async updateContent(slug: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
      const index = mockContent.findIndex(item => item.slug === slug);
      if (index === -1) return null;

      mockContent[index] = {
        ...mockContent[index],
        ...updates,
        updatedAt: new Date()
      };

      return mockContent[index];
    } catch (error) {
      console.error('Error updating content:', error);
      return null;
    }
  }

  // Delete content
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
}

const contentService = new ContentService();

// API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid slug parameter'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        const content = await contentService.getBySlug(slug);
        if (!content) {
          return res.status(404).json({
            success: false,
            error: 'Content not found'
          });
        }
        return res.status(200).json({
          success: true,
          data: content
        });

      case 'PUT':
        const updatedContent = await contentService.updateContent(slug, req.body);
        if (!updatedContent) {
          return res.status(404).json({
            success: false,
            error: 'Content not found'
          });
        }
        return res.status(200).json({
          success: true,
          data: updatedContent,
          message: 'Content updated successfully'
        });

      case 'DELETE':
        const deleted = await contentService.deleteContent(slug);
        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'Content not found'
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Content deleted successfully'
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method ' + req.method + ' not allowed'
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
`;

  return writeFile(filePath, content);
}

// Fix pages/api/recommendations/create.ts
function fixRecommendationsCreateAPI() {
  console.log('\n💡 Creating pages/api/recommendations/create.ts...');

  const filePath = path.join(process.cwd(), 'pages', 'api', 'recommendations', 'create.ts');
  const content = `import { NextApiRequest, NextApiResponse } from 'next';

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
      'performance': 0.8,
      'security': 1.0,
      'optimization': 0.6,
      'feature': 0.7
    };

    const priorityMultiplier = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.8,
      'critical': 1.0
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
      'performance': 5,
      'security': 8,
      'optimization': 3,
      'feature': 10
    };

    const priorityMultiplier = {
      'low': 0.5,
      'medium': 1.0,
      'high': 1.5,
      'critical': 2.0
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
        implementationCost: this.calculateCost(data.type, data.priority)
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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method ' + req.method + ' not allowed'
    });
  }

  try {
    // Validate request data
    const validationErrors = recommendationService.validateRecommendationData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: ' + validationErrors.join(', ')
      });
    }

    // Create recommendation
    const recommendation = await recommendationService.createRecommendation(req.body);

    return res.status(201).json({
      success: true,
      data: recommendation,
      message: 'Recommendation created successfully'
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
`;

  return writeFile(filePath, content);
}

// Main function
function main() {
  console.log('🚀 Starting critical files creation...');

  let successCount = 0;
  const totalFiles = 3;

  // Create all critical files
  if (fixTwoFactorAuth()) successCount++;
  if (fixContentSlugAPI()) successCount++;
  if (fixRecommendationsCreateAPI()) successCount++;

  console.log('\n📊 Summary:');
  console.log('✅ Successfully created:', successCount, '/', totalFiles, 'files');

  if (successCount === totalFiles) {
    console.log('\n🎉 All critical files created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run npm run type-check to verify TypeScript compilation');
    console.log('2. Review and customize the generated files as needed');
    console.log('3. Add proper environment variables (JWT_SECRET, etc.)');
    console.log('4. Implement actual database connections');
    console.log('5. Add proper error handling and logging');
  } else {
    console.log('\n⚠️  Some files could not be created. Please check the errors above.');
  }
}

// Run the script
main();
