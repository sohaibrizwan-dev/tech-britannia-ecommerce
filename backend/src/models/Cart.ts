import mongoose, { Schema, HydratedDocument, model, Types } from 'mongoose';
import { ICart, ICartItem } from '../types';

export type CartDocument = HydratedDocument<ICart>;

const CartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity cannot be less than 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate total before saving
CartSchema.pre<CartDocument>('save', function (next) {
  this.total = this.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  next();
});

// Method to add item to cart
CartSchema.methods.addItem = async function (
  this: CartDocument,
  productId: Types.ObjectId,
  price: number,
  quantity: number = 1
): Promise<void> {
  const existingItemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1 && this.items[existingItemIndex]) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({ product: productId, price, quantity });
  }

  await this.save();
};

// Method to remove item from cart
CartSchema.methods.removeItem = async function (
  this: CartDocument,
  productId: Types.ObjectId
): Promise<void> {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  await this.save();
};

// Method to update item quantity
CartSchema.methods.updateQuantity = async function (
  this: CartDocument,
  productId: Types.ObjectId,
  quantity: number
): Promise<void> {
  const itemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else if (this.items[itemIndex]) {
      this.items[itemIndex].quantity = quantity;
    }
    await this.save();
  }
};

// Method to clear cart
CartSchema.methods.clearCart = async function (
  this: CartDocument
): Promise<void> {
  this.items = [];
  this.total = 0;
  await this.save();
};

export const Cart = model<ICart>('Cart', CartSchema);
export default Cart;
