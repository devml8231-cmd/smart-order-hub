import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { paymentValidation } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create Razorpay payment order
 * @access  Private
 */
router.post('/create-order', paymentController.createPaymentOrder);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify payment signature
 * @access  Private
 */
router.post('/verify', paymentValidation.verify, paymentController.verifyPayment);

/**
 * @route   GET /api/v1/payments/:orderId
 * @desc    Get payment status
 * @access  Private
 */
router.get('/:orderId', paymentController.getPaymentStatus);

export default router;
