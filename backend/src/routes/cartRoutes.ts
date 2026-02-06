import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
  addToCartValidation,
  updateCartValidation,
} from '../controllers/cartController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All cart routes require authentication
router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCartValidation, addToCart);
router.put('/:productId', authMiddleware, updateCartValidation, updateCartItem);
router.delete('/:productId', authMiddleware, removeFromCart);
router.delete('/', authMiddleware, clearCart);
router.post('/merge', authMiddleware, mergeCart);

export default router;
