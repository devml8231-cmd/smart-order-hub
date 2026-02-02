import { Router } from 'express';
import vendorController from '../controllers/vendorController';
import { vendorValidation } from '../middleware/validation';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/vendors
 * @desc    Get all vendors
 * @access  Public
 */
router.get('/', vendorController.getVendors);

/**
 * @route   GET /api/v1/vendors/:vendorId
 * @desc    Get vendor by ID
 * @access  Public
 */
router.get('/:vendorId', vendorController.getVendorById);

/**
 * @route   POST /api/v1/vendors
 * @desc    Create vendor
 * @access  Admin
 */
router.post('/', authenticate, requireAdmin, vendorValidation.create, vendorController.createVendor);

/**
 * @route   PUT /api/v1/vendors/:vendorId
 * @desc    Update vendor
 * @access  Admin
 */
router.put('/:vendorId', authenticate, requireAdmin, vendorController.updateVendor);

export default router;
