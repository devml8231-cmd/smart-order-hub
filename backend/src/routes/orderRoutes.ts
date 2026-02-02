import { Router } from 'express';
import orderController from '../controllers/orderController';
import { orderValidation, paginationValidation } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', orderValidation.create, orderController.createOrder);

/**
 * @route   GET /api/v1/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get('/', paginationValidation.paginate, orderController.getUserOrders);

/**
 * @route   GET /api/v1/orders/:orderId
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:orderId', orderValidation.getById, orderController.getOrderById);

/**
 * @route   POST /api/v1/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post('/:orderId/cancel', orderValidation.getById, orderController.cancelOrder);

/**
 * @route   GET /api/v1/orders/:orderId/token-status
 * @desc    Get real-time token status
 * @access  Private
 */
router.get('/:orderId/token-status', orderValidation.getById, orderController.getTokenStatus);

export default router;
