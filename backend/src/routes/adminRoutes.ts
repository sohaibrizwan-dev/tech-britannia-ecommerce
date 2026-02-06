import { Router } from 'express';
import {
  getDashboardStats,
  getSalesData,
  getTopProducts,
  getLowStockAlerts,
} from '../controllers/adminController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/sales', authMiddleware, adminMiddleware, getSalesData);
router.get('/top-products', authMiddleware, adminMiddleware, getTopProducts);
router.get('/low-stock', authMiddleware, adminMiddleware, getLowStockAlerts);

export default router;
