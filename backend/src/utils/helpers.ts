import { Response } from 'express';
import { ApiResponse } from '../types';
import logger from './logger';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): Response => {
  logger.error('API Error:', { error, statusCode, details });
  
  const response: ApiResponse = {
    success: false,
    error,
    ...(process.env.NODE_ENV === 'development' && details && { details }),
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Generate random OTP
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Generate unique code for group orders
 */
export const generateUniqueCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  total: number,
  page: number,
  limit: number
) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };
};

/**
 * Calculate ETA based on queue and preparation time
 */
export const calculateETA = (
  queuePosition: number,
  avgPrepTime: number,
  currentTime: Date = new Date()
): { estimatedReadyTime: Date; estimatedMinutes: number } => {
  const estimatedMinutes = queuePosition * avgPrepTime;
  const estimatedReadyTime = new Date(
    currentTime.getTime() + estimatedMinutes * 60000
  );
  
  return {
    estimatedReadyTime,
    estimatedMinutes,
  };
};

/**
 * Validate time slot availability
 */
export const isValidTimeSlot = (
  pickupTime: Date,
  openingTime: string,
  closingTime: string
): boolean => {
  const pickupHour = pickupTime.getHours();
  const pickupMinute = pickupTime.getMinutes();
  
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);
  
  const pickupMinutes = pickupHour * 60 + pickupMinute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  
  return pickupMinutes >= openMinutes && pickupMinutes <= closeMinutes;
};

/**
 * Check if notification should be sent (order ready soon)
 */
export const shouldNotify = (
  estimatedReadyTime: Date,
  thresholdMinutes: number = 5
): boolean => {
  const now = new Date();
  const diffMs = estimatedReadyTime.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return diffMinutes <= thresholdMinutes && diffMinutes >= 0;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Sanitize phone number
 */
export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with country code, remove it
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  return cleaned;
};

/**
 * Check if time is peak hour (typical meal times)
 */
export const isPeakHour = (hour: number): boolean => {
  // Breakfast: 7-10, Lunch: 12-14, Dinner: 19-21
  return (
    (hour >= 7 && hour <= 10) ||
    (hour >= 12 && hour <= 14) ||
    (hour >= 19 && hour <= 21)
  );
};

/**
 * Get time of day category for recommendations
 */
export const getTimeOfDay = (hour: number): 'breakfast' | 'lunch' | 'snacks' | 'dinner' => {
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snacks';
  return 'dinner';
};

/**
 * Calculate discount percentage
 */
export const calculateDiscount = (
  originalPrice: number,
  discountedPrice: number
): number => {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate token number for the day
 */
export const generateTokenNumber = async (
  vendorId: string,
  orderDate: Date,
  supabase: any
): Promise<number> => {
  const { data, error } = await supabase.rpc('get_next_token_number', {
    p_vendor_id: vendorId,
    p_order_date: orderDate.toISOString().split('T')[0],
  });
  
  if (error) {
    logger.error('Error generating token number:', error);
    throw new Error('Failed to generate token number');
  }
  
  return data || 1;
};

/**
 * Sleep utility for testing/delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default {
  sendSuccess,
  sendError,
  generateOTP,
  generateUniqueCode,
  calculatePagination,
  calculateETA,
  isValidTimeSlot,
  shouldNotify,
  formatCurrency,
  sanitizePhoneNumber,
  isPeakHour,
  getTimeOfDay,
  calculateDiscount,
  isValidEmail,
  generateTokenNumber,
  sleep,
};
