import { Resend } from 'resend';
import logger from '../utils/logger';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Store owner email from environment
const STORE_OWNER_EMAIL = process.env.STORE_OWNER_EMAIL || 'owner@techbritannia.co.uk';
const FROM_EMAIL = 'TechBritannia <orders@techbritannia.co.uk>';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  paymentMethod: string;
  orderDate: Date;
}

// Generate beautiful HTML email template
const generateOrderEmailTemplate = (data: OrderEmailData, isOwnerNotification: boolean): string => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
          <div>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${item.name}</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Qty: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;">
        £${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const subject = isOwnerNotification 
    ? `🎉 New Order #${data.orderId} - £${data.total.toFixed(2)}`
    : `Order Confirmation #${data.orderId}`;

  const headerText = isOwnerNotification
    ? `<h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #00205b;">New Order Received! 🎉</h1>
       <p style="margin: 0; color: #64748b; font-size: 16px;">You have a new order from <strong>${data.customerName}</strong></p>`
    : `<h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #00205b;">Thank You for Your Order!</h1>
       <p style="margin: 0; color: #64748b; font-size: 16px;">Hi ${data.customerName}, your order has been confirmed</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
        ${headerText}
      </div>

      <!-- Order Info Banner -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #00205b;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #00205b;">#${data.orderId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Date</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">${new Date(data.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #1e293b;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 12px; overflow: hidden;">
          <thead>
            <tr style="background-color: #e2e8f0;">
              <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Product</th>
              <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Order Summary -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #64748b;">Subtotal</span>
          <span style="color: #1e293b; font-weight: 500;">£${data.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #64748b;">Shipping</span>
          <span style="color: #1e293b; font-weight: 500;">${data.shipping === 0 ? 'FREE' : `£${data.shipping.toFixed(2)}`}</span>
        </div>
        <div style="border-top: 2px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between;">
          <span style="font-size: 18px; font-weight: 700; color: #1e293b;">Total</span>
          <span style="font-size: 24px; font-weight: 800; color: #00205b;">£${data.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Shipping Address -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px;">
          <h4 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Shipping Address</h4>
          <p style="margin: 0; color: #1e293b; line-height: 1.6;">
            ${data.customerName}<br>
            ${data.shippingAddress.line1}<br>
            ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
            ${data.shippingAddress.city}, ${data.shippingAddress.postcode}<br>
            ${data.shippingAddress.country}
          </p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px;">
          <h4 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Payment Method</h4>
          <p style="margin: 0; color: #1e293b; font-weight: 600;">
            💳 ${data.paymentMethod}
          </p>
          ${isOwnerNotification ? `
          <h4 style="margin: 16px 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Customer Email</h4>
          <p style="margin: 0; color: #00205b; font-weight: 600;">
            <a href="mailto:${data.customerEmail}" style="color: #00205b; text-decoration: none;">${data.customerEmail}</a>
          </p>
          ` : ''}
        </div>
      </div>

      ${!isOwnerNotification ? `
      <!-- Delivery Info -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🚚</div>
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #065f46;">Estimated Delivery</h3>
        <p style="margin: 0; color: #047857; font-weight: 600;">Next Business Day</p>
        <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Order placed before 10pm</p>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${isOwnerNotification ? 'https://techbritannia.co.uk/admin' : `https://techbritannia.co.uk/account/orders/${data.orderId}`}" 
           style="display: inline-block; background: linear-gradient(135deg, #00205b 0%, #1e40af 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
          ${isOwnerNotification ? 'View in Dashboard →' : 'Track Your Order →'}
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #1e293b; padding: 32px; text-align: center;">
      <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">
        Questions? Contact us at <a href="mailto:support@techbritannia.co.uk" style="color: #93c5fd;">support@techbritannia.co.uk</a>
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} TechBritannia. All rights reserved.<br>
        UK-based support available 24/7
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

// Send order notification to store owner
export const sendOrderNotificationToOwner = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    const html = generateOrderEmailTemplate(orderData, true);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: STORE_OWNER_EMAIL,
      subject: `🎉 New Order #${orderData.orderId} - £${orderData.total.toFixed(2)} from ${orderData.customerName}`,
      html,
    });

    if (error) {
      logger.error('Failed to send owner notification email', { error });
      return false;
    }

    logger.info('Owner notification email sent successfully', { emailId: data?.id, orderId: orderData.orderId });
    return true;
  } catch (err) {
    logger.error('Error sending owner notification email', { error: err });
    return false;
  }
};

// Send order confirmation to customer
export const sendOrderConfirmationToCustomer = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    const html = generateOrderEmailTemplate(orderData, false);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.orderId} - TechBritannia`,
      html,
    });

    if (error) {
      logger.error('Failed to send customer confirmation email', { error });
      return false;
    }

    logger.info('Customer confirmation email sent successfully', { emailId: data?.id, orderId: orderData.orderId });
    return true;
  } catch (err) {
    logger.error('Error sending customer confirmation email', { error: err });
    return false;
  }
};

// Send both emails for a new order
export const sendOrderEmails = async (orderData: OrderEmailData): Promise<{ ownerSent: boolean; customerSent: boolean }> => {
  const [ownerSent, customerSent] = await Promise.all([
    sendOrderNotificationToOwner(orderData),
    sendOrderConfirmationToCustomer(orderData),
  ]);

  return { ownerSent, customerSent };
};

export default {
  sendOrderNotificationToOwner,
  sendOrderConfirmationToCustomer,
  sendOrderEmails,
};
