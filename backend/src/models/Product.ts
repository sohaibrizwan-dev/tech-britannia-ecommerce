import mongoose, { Schema, HydratedDocument, model, Types } from 'mongoose';
import { IProduct } from '../types';

export type ProductDocument = HydratedDocument<IProduct>;

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot be more than 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Please provide a brand'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL'],
    },
    images: {
      type: [String],
      default: [],
    },
    isRecentlyAdded: {
      type: Boolean,
      default: false,
    },
    specs: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    technicalSpecs: {
      type: Map,
      of: String,
      default: {},
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    relatedProductIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ProductSchema.index({ name: 'text', description: 'text', category: 'text' });
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function (this: ProductDocument) {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function (this: ProductDocument) {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= 10) return 'Low Stock';
  return 'In Stock';
});

export const Product = model<IProduct>('Product', ProductSchema);
export default Product;
