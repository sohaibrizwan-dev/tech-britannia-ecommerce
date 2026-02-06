import { Router } from 'express';
import { submitContactForm, contactValidation } from '../controllers/contactController';

const router = Router();

// Public route - anyone can submit contact form
router.post('/', contactValidation, submitContactForm);

export default router;
