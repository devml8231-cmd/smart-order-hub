import { Router } from 'express';
import menuController from '../controllers/menuController';
import { menuValidation, searchValidation, paginationValidation } from '../middleware/validation';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/menu
 * @desc    Get all menu items
 * @access  Public
 */
router.get('/', optionalAuth, paginationValidation.paginate, menuController.getMenuItems);

/**
 * @route   GET /api/v1/menu/search
 * @desc    Search menu items
 * @access  Public
 */
router.get('/search', searchValidation.search, menuController.searchMenuItems);

/**
 * @route   GET /api/v1/menu/recommendations
 * @desc    Get personalized recommendations
 * @access  Public/Private
 */
router.get('/recommendations', optionalAuth, menuController.getRecommendations);

/**
 * @route   GET /api/v1/menu/:itemId
 * @desc    Get menu item by ID
 * @access  Public
 */
router.get('/:itemId', optionalAuth, menuController.getMenuItemById);

/**
 * @route   POST /api/v1/menu
 * @desc    Create menu item
 * @access  Admin
 */
router.post('/', authenticate, requireAdmin, menuValidation.create, menuController.createMenuItem);

/**
 * @route   PUT /api/v1/menu/:itemId
 * @desc    Update menu item
 * @access  Admin
 */
router.put('/:itemId', authenticate, requireAdmin, menuValidation.update, menuController.updateMenuItem);

/**
 * @route   POST /api/v1/menu/:itemId/stock
 * @desc    Update stock quantity
 * @access  Admin
 */
router.post('/:itemId/stock', authenticate, requireAdmin, menuValidation.updateStock, menuController.updateStock);

export default router;
