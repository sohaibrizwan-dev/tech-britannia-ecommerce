import mongoose, { Schema, HydratedDocument, model, Types } from 'mongoose';
import { IOrder, IOrderItem, OrderStatus } from '../types';

export type OrderDocument = HydratedDocument<IOrder>;

const OrderItemSchema = new Schema<IOrderItem>(
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
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },
    shipping: {
      type: Number,
      required: true,
      min: [0, 'Shipping cannot be negative'],
    },
    vat: {
      type: Number,
      required: true,
      min: [0, 'VAT cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Processing',
    },
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      postcode: {
        type: String,
        required: true,
      },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentIntentId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });

// Generate order number
OrderSchema.virtual('orderNumber').get(function (this: OrderDocument) {
  return `TB-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Calculate totals before saving
OrderSchema.pre<OrderDocument>('save', function (next) {
  if (!this.subtotal) {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }

  if (!this.vat) {
    this.vat = this.subtotal * 0.2;
  }

  if (!this.total) {
    this.total = this.subtotal + this.shipping + this.vat;
  }

  next();
});

export const Order = model<IOrder>('Order', OrderSchema);
export default Order;
