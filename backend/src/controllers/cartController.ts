import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Cart from '../models/Cart';
import Product from '../models/Product';

// Validation rules
export const addToCartValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const updateCartValidation = [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
];

// Get cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    let cart = await Cart.findOne({ user: req.user!.userId }).populate('items.product');

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({
        user: req.user!.userId,
        items: [],
        total: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
    });
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { productId, quantity } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    // Check stock
    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: 'Not enough stock available',
      });
      return;
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      cart = new Cart({
        user: req.user!.userId,
        items: [],
        total: 0,
      });
    }

    // Add item
    await cart.addItem!(productId, product.price, quantity);

    // Populate and return
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    // Get cart
    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
      return;
    }

    // Check product stock if increasing quantity
    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      const currentItem = cart.items.find(
        (item) => item.product.toString() === productId
      );
      const currentQty = currentItem ? currentItem.quantity : 0;

      if (product.stock < quantity + (currentQty > 0 ? 0 : 0)) {
        res.status(400).json({
          success: false,
          message: 'Not enough stock available',
        });
        return;
      }
    }

    // Update quantity
    await cart.updateQuantity!(new Types.ObjectId(productId), quantity);

    // Populate and return
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
      return;
    }

    await cart.removeItem!(new Types.ObjectId(productId));
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
    });
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
      return;
    }

    await cart.clearCart!();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
    });
  }
};

// Merge guest cart with user cart (optional - for when user logs in)
export const mergeCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items } = req.body; // Array of { productId, quantity }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid items array',
      });
      return;
    }

    let cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      cart = new Cart({
        user: req.user!.userId,
        items: [],
        total: 0,
      });
    }

    // Add each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product && product.stock >= item.quantity) {
        const existingItem = cart.items.find(
          (i) => i.product.toString() === item.productId
        );
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          cart.items.push({
            product: item.productId,
            quantity: item.quantity,
            price: product.price,
          });
        }
      }
    }

    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error merging cart',
    });
  }
};
