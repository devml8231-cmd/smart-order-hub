import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    sendError(res, 'Validation error', 400, err.message);
    return;
  }

  if (err.name === 'UnauthorizedError') {
    sendError(res, 'Unauthorized access', 401);
    return;
  }

  if (err.name === 'ForbiddenError') {
    sendError(res, 'Access forbidden', 403);
    return;
  }

  // Default error response
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    500,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

/**
 * Handle 404 - Not Found
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
