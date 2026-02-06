import { Request, Response } from 'express';
import { Resend } from 'resend';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Store owner email from environment
const STORE_OWNER_EMAIL = process.env.STORE_OWNER_EMAIL || 'owner@techbritannia.co.uk';
// NOTE: Using Resend's test domain for development. 
// For production, verify your domain at resend.com/domains and update this.
const FROM_EMAIL = 'TechBritannia <onboarding@resend.dev>';

// Validation rules for contact form
export const contactValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('orderNumber').optional().trim(),
];

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  orderNumber?: string;
  message: string;
}

// Generate contact email HTML template
const generateContactEmailTemplate = (data: ContactFormData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00205b 0%, #1e40af 100%); padding: 32px; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <div style="width: 40px; height: 40px; background-color: #c8102e; border-radius: 12px 0 12px 0; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-weight: bold; font-size: 20px;">T</span>
        </div>
        <span style="color: white; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Tech<span style="color: #93c5fd;">Britannia</span></span>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 32px;">
      
      <!-- Greeting -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #00205b;">📬 New Contact Form Message</h1>
        <p style="margin: 0; color: #64748b; font-size: 16px;">You have received a new message from the website</p>
      </div>

      <!-- Customer Info Banner -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #00205b;">
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">From</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #00205b;">${data.firstName} ${data.lastName}</p>
        </div>
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">
            <a href="mailto:${data.email}" style="color: #00205b; text-decoration: none;">${data.email}</a>
          </p>
        </div>
        ${data.orderNumber ? `
        <div>
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Reference</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">#${data.orderNumber}</p>
        </div>
        ` : ''}
      </div>

      <!-- Message -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Message</h3>
        <p style="margin: 0; color: #1e293b; line-height: 1.8; white-space: pre-wrap;">${data.message}</p>
      </div>

      <!-- Reply Button -->
      <div style="text-align: center;">
        <a href="mailto:${data.email}?subject=Re: Your inquiry to TechBritannia" 
           style="display: inline-block; background: linear-gradient(135deg, #00205b 0%, #1e40af 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
          Reply to ${data.firstName} →
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #1e293b; padding: 24px; text-align: center;">
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        This email was sent from the TechBritannia contact form.<br>
        Received at ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

// Generate auto-reply email for customer
const generateAutoReplyTemplate = (data: ContactFormData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We've Received Your Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00205b 0%, #1e40af 100%); padding: 32px; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <div style="width: 40px; height: 40px; background-color: #c8102e; border-radius: 12px 0 12px 0; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-weight: bold; font-size: 20px;">T</span>
        </div>
        <span style="color: white; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Tech<span style="color: #93c5fd;">Britannia</span></span>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 32px;">
      
      <!-- Greeting -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #00205b;">Thanks for Reaching Out!</h1>
        <p style="margin: 0; color: #64748b; font-size: 16px;">Hi ${data.firstName}, we've received your message</p>
      </div>

      <!-- Info Box -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: center;">
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #065f46;">What Happens Next?</h3>
        <p style="margin: 0; color: #047857;">Our UK-based support team will review your message and get back to you within 24 hours.</p>
      </div>

      <!-- Message Copy -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Your Message</h3>
        <p style="margin: 0; color: #1e293b; line-height: 1.8; white-space: pre-wrap; font-style: italic;">"${data.message}"</p>
      </div>

      <!-- Contact Info -->
      <div style="text-align: center; color: #64748b; font-size: 14px;">
        <p style="margin: 0 0 8px;">Need urgent help?</p>
        <p style="margin: 0;">📞 Call us: <strong style="color: #1e293b;">020 7946 0123</strong> (9am - 5pm)</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #1e293b; padding: 24px; text-align: center;">
      <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">
        This is an automated response. Please do not reply directly to this email.
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} TechBritannia. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Handle contact form submission
 * POST /api/contact
 */
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { firstName, lastName, email, orderNumber, message } = req.body as ContactFormData;

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('RESEND_API_KEY not configured');
      res.status(500).json({
        success: false,
        message: 'Email service not configured. Please try again later.',
      });
      return;
    }

    // Send email to store owner
    const ownerEmailHtml = generateContactEmailTemplate({ firstName, lastName, email, orderNumber, message });
    
    const { data: ownerEmailData, error: ownerEmailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: STORE_OWNER_EMAIL,
      replyTo: email,
      subject: `📬 New Contact Form Message from ${firstName} ${lastName}`,
      html: ownerEmailHtml,
    });

    if (ownerEmailError) {
      logger.error('Failed to send contact email to owner', { error: ownerEmailError });
      res.status(500).json({
        success: false,
        message: 'Failed to send your message. Please try again.',
      });
      return;
    }

    logger.info('Contact email sent to owner', { 
      emailId: ownerEmailData?.id, 
      from: email, 
      hasOrderNumber: !!orderNumber 
    });

    // Send auto-reply to customer
    const autoReplyHtml = generateAutoReplyTemplate({ firstName, lastName, email, orderNumber, message });
    
    const { error: autoReplyError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `We've received your message - TechBritannia`,
      html: autoReplyHtml,
    });

    if (autoReplyError) {
      // Log but don't fail - the main message was sent
      logger.warn('Failed to send auto-reply to customer', { error: autoReplyError, customerEmail: email });
    } else {
      logger.info('Auto-reply sent to customer', { customerEmail: email });
    }

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you within 24 hours.',
    });
  } catch (error) {
    logger.error('Error processing contact form', { error });
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};
