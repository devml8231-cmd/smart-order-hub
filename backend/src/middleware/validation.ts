import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../utils/helpers';

/**
 * Middleware to check validation results
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    sendError(res, 'Validation failed', 400, { errors: errorMessages });
    return;
  }
  
  next();
};

// =============================================
// Validation Rules
// =============================================

export const authValidation = {
  sendOTP: [
    body('phone_number')
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid Indian phone number format'),
    validate,
  ],
  
  verifyOTP: [
    body('phone_number')
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid Indian phone number format'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    validate,
  ],
};

export const orderValidation = {
  create: [
    body('vendor_id').isUUID().withMessage('Invalid vendor ID'),
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.menu_item_id').isUUID().withMessage('Invalid menu item ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('pickup_time').isISO8601().withMessage('Invalid pickup time format'),
    body('special_instructions').optional().isString(),
    body('group_order_id').optional().isUUID(),
    validate,
  ],
  
  updateStatus: [
    param('orderId').isUUID().withMessage('Invalid order ID'),
    body('status')
      .isIn(['PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid order status'),
    body('cancellation_reason').optional().isString(),
    validate,
  ],
  
  getById: [
    param('orderId').isUUID().withMessage('Invalid order ID'),
    validate,
  ],
};

export const menuValidation = {
  create: [
    body('vendor_id').isUUID().withMessage('Invalid vendor ID'),
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('food_type')
      .isIn(['VEG', 'NON_VEG', 'VEGAN', 'UPWAS'])
      .withMessage('Invalid food type'),
    body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
    body('preparation_time_minutes').optional().isInt({ min: 1 }),
    body('category_id').optional().isUUID(),
    validate,
  ],
  
  update: [
    param('itemId').isUUID().withMessage('Invalid item ID'),
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('is_available').optional().isBoolean(),
    validate,
  ],
  
  updateStock: [
    param('itemId').isUUID().withMessage('Invalid item ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
    body('reason').optional().isString(),
    validate,
  ],
};

export const reviewValidation = {
  create: [
    body('order_id').isUUID().withMessage('Invalid order ID'),
    body('menu_item_id').isUUID().withMessage('Invalid menu item ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }),
    body('is_anonymous').optional().isBoolean(),
    validate,
  ],
};

export const paymentValidation = {
  verify: [
    body('razorpay_order_id').trim().notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').trim().notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').trim().notEmpty().withMessage('Signature is required'),
    validate,
  ],
};

export const groupOrderValidation = {
  create: [
    body('vendor_id').isUUID().withMessage('Invalid vendor ID'),
    body('pickup_time').isISO8601().withMessage('Invalid pickup time format'),
    body('group_name').optional().trim().isLength({ max: 255 }),
    validate,
  ],
  
  join: [
    param('groupCode').trim().notEmpty().withMessage('Group code is required'),
    validate,
  ],
};

export const paginationValidation = {
  paginate: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate,
  ],
};

export const searchValidation = {
  search: [
    query('q').trim().notEmpty().withMessage('Search query is required'),
    query('vendor_id').optional().isUUID(),
    validate,
  ],
};

export const vendorValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Vendor name is required'),
    body('phone_number')
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('address').optional().trim(),
    body('opening_time').optional().matches(/^\d{2}:\d{2}$/),
    body('closing_time').optional().matches(/^\d{2}:\d{2}$/),
    validate,
  ],
};

export default {
  validate,
  authValidation,
  orderValidation,
  menuValidation,
  reviewValidation,
  paymentValidation,
  groupOrderValidation,
  paginationValidation,
  searchValidation,
  vendorValidation,
};
