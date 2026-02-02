import { Router } from 'express';
import reviewController from '../controllers/reviewController';
import { reviewValidation, paginationValidation } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/reviews/menu-item/:itemId
 * @desc    Get reviews for menu item
 * @access  Public
 */
router.get('/menu-item/:itemId', paginationValidation.paginate, reviewController.getMenuItemReviews);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create review
 * @access  Private
 */
router.post('/', authenticate, reviewValidation.create, reviewController.createReview);

/**
 * @route   POST /api/v1/reviews/favorites
 * @desc    Add to favorites
 * @access  Private
 */
router.post('/favorites', authenticate, reviewController.addFavorite);

/**
 * @route   DELETE /api/v1/reviews/favorites/:itemId
 * @desc    Remove from favorites
 * @access  Private
 */
router.delete('/favorites/:itemId', authenticate, reviewController.removeFavorite);

/**
 * @route   GET /api/v1/reviews/favorites
 * @desc    Get user favorites
 * @access  Private
 */
router.get('/favorites', authenticate, reviewController.getUserFavorites);

export default router;
