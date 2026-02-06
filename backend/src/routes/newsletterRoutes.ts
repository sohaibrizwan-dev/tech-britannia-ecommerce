import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post('/subscribe', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Please provide an email address',
    });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
    return;
  }

  // In a real application, you would save this to a database or 
  // send it to an email service like Mailchimp.
  // For now, we'll just return success.
  
  res.status(200).json({
    success: true,
    message: 'Thank you for subscribing to our newsletter!',
  });
});

export default router;
