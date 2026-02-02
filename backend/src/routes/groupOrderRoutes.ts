import { Router } from 'express';
import groupOrderController from '../controllers/groupOrderController';
import { groupOrderValidation } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/group-orders
 * @desc    Create group order
 * @access  Private
 */
router.post('/', authenticate, groupOrderValidation.create, groupOrderController.createGroupOrder);

/**
 * @route   GET /api/v1/group-orders/join/:groupCode
 * @desc    Join group order by code
 * @access  Public
 */
router.get('/join/:groupCode', groupOrderValidation.join, groupOrderController.joinGroupOrder);

/**
 * @route   POST /api/v1/group-orders/:groupId/lock
 * @desc    Lock group order
 * @access  Private (Creator only)
 */
router.post('/:groupId/lock', authenticate, groupOrderController.lockGroupOrder);

/**
 * @route   GET /api/v1/group-orders/:groupId
 * @desc    Get group order details
 * @access  Public
 */
router.get('/:groupId', groupOrderController.getGroupOrderDetails);

export default router;
