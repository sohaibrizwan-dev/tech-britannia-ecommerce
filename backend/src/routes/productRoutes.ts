import { Router } from 'express';
import {
  getProducts,
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFeaturedProducts,
  searchProducts,
  getBestSellers,
  getBrands,
  createProductValidation,
  updateProductValidation,
} from '../controllers/productController';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestSellers);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Protected admin routes
router.post('/', authMiddleware, adminMiddleware, createProductValidation, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProductValidation, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;
