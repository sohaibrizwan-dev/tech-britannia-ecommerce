import { Request, Response } from 'express';
import { z } from 'zod';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import User from '../models/User';
import { IProduct } from '../types';
import { sendOrderEmails } from '../services/emailService';
import logger from '../utils/logger';

// Zod Schemas for strict validation
const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const AddressSchema = z.object({
  fullName: z.string().min(1).trim(),
  email: z.string().email().trim(),
  address: z.string().min(1).trim(),
  address2: z.string().optional(),
  city: z.string().min(1).trim(),
  postcode: z.string().min(1).trim(),
  country: z.string().optional(),
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).optional(),
  shippingAddress: AddressSchema,
});

// Create order from cart (or directly from provided items)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Strict Zod Validation
    const validation = CreateOrderSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors,
      });
      return;
    }

    const { items: bodyItems, shippingAddress } = validation.data;

    if (bodyItems && bodyItems.length > 0) {
      // ===== Path A: Build order directly from items sent by frontend =====
      const productIds = bodyItems.map((i) => i.productId);

      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map<string, IProduct & { _id: any }>();
      products.forEach((p: any) => productMap.set(p._id.toString(), p));

      const orderItems: {
        product: any;
        quantity: number;
        price: number;
        name: string;
        image: string;
      }[] = [];

      let subtotal = 0;

      for (const item of bodyItems) {
        const { productId, quantity } = item;
        const product = productMap.get(productId);
        
        if (!product) {
          res.status(400).json({
            success: false,
            message: 'Product in basket no longer exists',
          });
          return;
        }

        if (product.stock < quantity) {
          res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.name}. Only ${product.stock} available.`,
          });
          return;
        }

        const linePrice = product.price;
        subtotal += linePrice * quantity;

        orderItems.push({
          product: (product as any)._id,
          quantity,
          price: linePrice,
          name: product.name,
          image: product.image,
        });
      }

      if (orderItems.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid items to create order',
        });
        return;
      }

      const vat = subtotal * 0.2; // 20% VAT
      const shipping = subtotal > 50 ? 0 : 5.99;
      const total = subtotal + shipping;

      const order = await Order.create({
        user: req.user!.userId,
        items: orderItems,
        total,
        subtotal,
        shipping,
        vat,
        shippingAddress: shippingAddress, // Use validated address
        status: 'Processing',
        paymentStatus: 'pending',
      });

      // Reduce stock
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      await order.populate('items.product');

      // Send email notifications (non-blocking)
      sendOrderEmails({
        orderId: order._id.toString().slice(-8).toUpperCase(),
        customerName: shippingAddress.fullName,
        customerEmail: shippingAddress.email,
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        subtotal,
        shipping,
        total,
        shippingAddress: {
          line1: shippingAddress.address,
          line2: shippingAddress.address2,
          city: shippingAddress.city,
          postcode: shippingAddress.postcode,
          country: shippingAddress.country || 'United Kingdom',
        },
        paymentMethod: 'Card ending in ****',
        orderDate: new Date(),
      }).then(result => {
        logger.info('Order emails sent', { orderId: order._id, ...result });
      }).catch(err => {
        logger.error('Failed to send order emails', { orderId: order._id, error: err });
      });

      res.status(201).json({
        success: true,
        data: order,
      });
    } else {
      // ===== Path B: Legacy path using server-side Cart (kept for compatibility) =====
      // Get user's cart
      const cart = await Cart.findOne({ user: req.user!.userId }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Cart is empty',
        });
        return;
      }

      // Check stock availability for all items
      for (const item of cart.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          res.status(400).json({
            success: false,
            message: 'Product in cart no longer exists',
          });
          return;
        }
        if (product.stock < item.quantity) {
          res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.name}. Only ${product.stock} available.`,
          });
          return;
        }
      }

      // Calculate totals
      const subtotal = cart.total;
      const vat = subtotal * 0.2; // 20% VAT
      const shipping = subtotal > 50 ? 0 : 5.99;
      const total = subtotal + shipping;

      // Prepare order items - type guard for populated products
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
        shippingAddress: shippingAddress, // Use validated address
        status: 'Processing',
        paymentStatus: 'pending',
      });

      // Reduce stock
      for (const item of cart.items) {
        const product = item.product as IProduct;
        await Product.findByIdAndUpdate((product as any)._id, {
          $inc: { stock: -item.quantity },
        });
      }

      // Clear cart
      await cart.clearCart!();

      await order.populate('items.product');

      // Send email notifications (non-blocking)
      sendOrderEmails({
        orderId: order._id.toString().slice(-8).toUpperCase(),
        customerName: shippingAddress.fullName,
        customerEmail: shippingAddress.email,
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        subtotal,
        shipping,
        total,
        shippingAddress: {
          line1: shippingAddress.address,
          line2: shippingAddress.address2,
          city: shippingAddress.city,
          postcode: shippingAddress.postcode,
          country: shippingAddress.country || 'United Kingdom',
        },
        paymentMethod: 'Card ending in ****',
        orderDate: new Date(),
      }).then(result => {
        logger.info('Order emails sent', { orderId: order._id, ...result });
      }).catch(err => {
        logger.error('Failed to send order emails', { orderId: order._id, error: err });
      });

      res.status(201).json({
        success: true,
        data: order,
      });
    }
  } catch (error) {
    logger.error('Create order error', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating order',
    });
  }
};

// Get user's orders
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user!.userId })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user!.userId });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
    });
  }
};

// Get single order
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user!.userId,
    }).populate('items.product');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
    });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
    });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // explicit role check for defense in depth
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.',
      });
      return;
    }

    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Update order status error', { error, orderId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
    });
  }
};

// Update payment status (admin only - users must use Stripe Webhook)
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentStatus, stripePaymentIntentId } = req.body;

    // CRITICAL: Prevent users from bypassing payment. Admin only.
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Payment updates are restricted to Admins and Webhooks.',
      });
      return;
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
      return;
    }

    const updateData: any = { paymentStatus };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Update payment status error', { error, orderId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
    });
  }
};

// Get order statistics (admin only)
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const totalProductsSold = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });

    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProductsSold: totalProductsSold[0]?.total || 0,
        activeUsers: totalUsers,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>),
        recentOrders,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
    });
  }
};
