import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { IProduct } from '../types';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for checkout
 */
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, shippingAddress } = req.body;

    // If orderId provided, get existing order
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user!.userId,
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Stripe uses cents
        currency: 'gbp',
        metadata: {
          orderId: order._id.toString(),
          userId: req.user!.userId,
        },
      });

      // Update order with payment intent ID
      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: order.total,
          currency: 'gbp',
        },
      });
      return;
    }

    // Create order from cart if no orderId provided
    const cart = await Cart.findOne({ user: req.user!.userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
      return;
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email) {
      res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
      return;
    }

    // Calculate totals
    const subtotal = cart.total;
    const vat = subtotal * 0.2;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;

    // Prepare order items
    const orderItems = cart.items.map((item) => {
      const product = item.product as IProduct;
      return {
        product: (product as any)._id,
        quantity: item.quantity,
        price: item.price,
        name: product.name,
        image: product.image,
      };
    });

    // Create order
    const order = await Order.create({
      user: req.user!.userId,
      items: orderItems,
      total,
      subtotal,
      shipping,
      vat,
      shippingAddress,
      status: 'Processing',
      paymentStatus: 'pending',
    });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'gbp',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user!.userId,
      },
    });

    // Update order with payment intent ID
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: total,
        currency: 'gbp',
        orderId: order._id,
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
    });
  }
};

/**
 * Confirm payment was successful
 */
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user!.userId,
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'completed';
      await order.save();

      // Clear the user's cart
      const cart = await Cart.findOne({ user: req.user!.userId });
      if (cart) {
        await cart.clearCart!();
      }

      // Reduce stock for purchased items
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          success: true,
          paymentIntentId,
          status: 'succeeded',
          orderId: order._id,
          orderNumber: `TB-${order._id.toString().slice(-6).toUpperCase()}`,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
    });
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && order.paymentStatus !== 'completed') {
          order.paymentStatus = 'completed';
          await order.save();

          // Clear cart and reduce stock
          const cart = await Cart.findOne({ user: order.user });
          if (cart) {
            await cart.clearCart!();
          }

          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: -item.quantity },
            });
          }

          console.log(`Order ${orderId} payment completed via webhook`);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
          console.log(`Order ${orderId} payment failed via webhook`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

/**
 * Get payment status for an order
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user!.userId,
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        status: order.paymentStatus,
        orderId: order._id,
      },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
    });
  }
};
