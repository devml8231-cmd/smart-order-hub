import { Router } from 'express';
import authRoutes from './authRoutes';
import orderRoutes from './orderRoutes';
import menuRoutes from './menuRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';
import reviewRoutes from './reviewRoutes';
import groupOrderRoutes from './groupOrderRoutes';
import vendorRoutes from './vendorRoutes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Food Pre-Order API is running',
    timestamp: new Date().toISOString(),
  });
});

// Public routes
router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/menu', menuRoutes);
router.use('/reviews', reviewRoutes);
router.use('/group-orders', groupOrderRoutes);

// Protected routes (require authentication)
router.use('/orders', authenticate, orderRoutes);
router.use('/payments', authenticate, paymentRoutes);

// Admin routes
router.use('/admin', authenticate, adminRoutes);

export default router;
