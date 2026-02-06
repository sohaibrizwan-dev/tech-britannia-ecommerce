import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserStatus,
  updateProfileValidation,
  changePasswordValidation,
} from '../controllers/userController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// User profile routes (authenticated)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, updateProfile);
router.put('/change-password', authMiddleware, changePasswordValidation, changePassword);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.put('/:id/status', authMiddleware, adminMiddleware, updateUserStatus);

export default router;
