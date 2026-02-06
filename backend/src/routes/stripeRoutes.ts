import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentStatus,
} from '../controllers/stripeController';

const router = Router();

// Webhook route - must be before JSON parsing middleware
// Raw body is needed for Stripe signature verification
router.post('/webhook', handleWebhook);

// Protected routes - require authentication
router.use(authMiddleware);

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm/:orderId', confirmPayment);

// Get payment status
router.get('/status/:orderId', getPaymentStatus);

export default router;
