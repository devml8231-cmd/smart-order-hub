import { Router } from 'express';
import adminController from '../controllers/adminController';
import { orderValidation, paginationValidation } from '../middleware/validation';
import { authenticate, requireAdmin, logAdminAction } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

/**
 * @route   PUT /api/v1/admin/orders/:orderId/status
 * @desc    Update order status
 * @access  Admin
 */
router.put(
  '/orders/:orderId/status',
  logAdminAction('UPDATE_ORDER_STATUS'),
  orderValidation.updateStatus,
  adminController.updateOrderStatus
);

/**
 * @route   GET /api/v1/admin/orders/queue
 * @desc    Get order queue
 * @access  Admin
 */
router.get('/orders/queue', paginationValidation.paginate, adminController.getOrderQueue);

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get analytics dashboard data
 * @access  Admin
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @route   POST /api/v1/admin/surplus-food
 * @desc    Manage surplus food discounts
 * @access  Admin
 */
router.post('/surplus-food', logAdminAction('CREATE_SURPLUS_FOOD'), adminController.manageSurplusFood);

/**
 * @route   GET /api/v1/admin/idle-slots
 * @desc    Get idle time slots
 * @access  Admin
 */
router.get('/idle-slots', adminController.getIdleTimeSlots);

export default router;
