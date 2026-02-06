import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout,
  registerValidation,
  loginValidation,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', authMiddleware, logout);

export default router;
