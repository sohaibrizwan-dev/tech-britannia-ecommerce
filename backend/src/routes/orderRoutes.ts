import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
} from '../controllers/orderController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// User order routes
router.post('/', authMiddleware, createOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getOrder);

// Admin order routes
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.get('/stats/overview', authMiddleware, adminMiddleware, getOrderStats);
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);
router.put('/:id/payment', authMiddleware, adminMiddleware, updatePaymentStatus); // Restricted to Admin only

export default router;
