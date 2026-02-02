import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, UserRole } from '../types';
import { sendError } from '../utils/helpers';
import logger from '../utils/logger';

/**
 * Middleware to verify Supabase JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No authorization token provided', 401);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid or expired token', { error });
      sendError(res, 'Invalid or expired token', 401);
      return;
    }

    // Fetch user profile from database
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      logger.error('User profile not found', { userId: user.id, error: profileError });
      sendError(res, 'User profile not found', 404);
      return;
    }

    // Check if user is active
    if (!userProfile.is_active) {
      sendError(res, 'User account is inactive', 403);
      return;
    }

    // Attach user to request object
    (req as AuthenticatedRequest).user = {
      id: user.id,
      phone_number: userProfile.phone_number,
      role: userProfile.role,
      email: userProfile.email,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    sendError(res, 'Authentication failed', 500);
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== 'ADMIN') {
    sendError(res, 'Admin access required', 403);
    return;
  }

  next();
};

/**
 * Middleware to check for specific roles
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !roles.includes(user.role)) {
      sendError(res, `Access denied. Required roles: ${roles.join(', ')}`, 403);
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfile && userProfile.is_active) {
        (req as AuthenticatedRequest).user = {
          id: user.id,
          phone_number: userProfile.phone_number,
          role: userProfile.role,
          email: userProfile.email,
        };
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = (actionType: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;

    if (user && user.role === 'ADMIN') {
      try {
        await supabaseAdmin.from('admin_actions').insert({
          admin_id: user.id,
          action_type: actionType,
          description: `${actionType} - ${req.method} ${req.path}`,
          metadata: {
            method: req.method,
            path: req.path,
            body: req.body,
            query: req.query,
          },
          ip_address: req.ip,
        });
      } catch (error) {
        logger.error('Failed to log admin action:', error);
      }
    }

    next();
  };
};

export default {
  authenticate,
  requireAdmin,
  requireRole,
  optionalAuth,
  logAdminAction,
};
