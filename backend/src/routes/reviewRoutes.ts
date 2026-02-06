import { Router } from 'express';
import { getReviews, getFeaturedReviews } from '../controllers/reviewController';

const router = Router();

// Public routes to fetch customer reviews
router.get('/', getReviews);
router.get('/featured', getFeaturedReviews);

export default router;

