/**
 * Authentication middleware for API routes
 * Provides user authentication and role-based authorization
 */

import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from 'next';

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  userRole?: string;
}

/**
 * Authenticate user using Clerk
 * @param req - API request object
 * @param res - API response object
 * @returns Promise<boolean> - Authentication status
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<boolean> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return false;
    }

    req.userId = userId;
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
    return false;
  }
};

/**
 * Authorize user role for specific operations
 * @param req - Authenticated API request object
 * @param res - API response object
 * @param requiredRole - Required role for authorization
 * @returns Promise<boolean> - Authorization status
 */
export const authorizeRole = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  requiredRole: string
): Promise<boolean> => {
  try {
    // In a real application, you would fetch user role from database
    // For now, we'll use a simple role check
    const userRole = req.userRole || 'user';

    const roleHierarchy: Record<string, number> = {
      user: 1,
      admin: 2,
      super_admin: 3,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({
        error: `Forbidden - Required role: ${requiredRole}, User role: ${userRole}`,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(403).json({ error: 'Authorization failed' });
    return false;
  }
};

/**
 * Combined authentication and authorization middleware
 * @param requiredRole - Required role for access
 * @returns Middleware function
 */
export const requireAuth = (requiredRole: string = 'user') => {
  return async (req: AuthenticatedRequest, res: NextApiResponse, next: () => void) => {
    const isAuthenticated = await authenticateUser(req, res);
    if (!isAuthenticated) return;

    const isAuthorized = await authorizeRole(req, res, requiredRole);
    if (!isAuthorized) return;

    next();
  };
};

export default {
  authenticateUser,
  authorizeRole,
  requireAuth,
};
