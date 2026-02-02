import { Router } from 'express';
import authController from '../controllers/authController';
import { authValidation } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', authValidation.sendOTP, authController.sendOTP);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/verify-otp', authValidation.verifyOTP, authController.verifyOTP);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authController.getProfile);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authController.updateProfile);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authController.logout);

export default router;
