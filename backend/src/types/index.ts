import { Types } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword?: (candidatePassword: string) => Promise<boolean>;
}

export interface IProduct {
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  isRecentlyAdded?: boolean;
  specs: string[];
  description?: string;
  technicalSpecs?: Record<string, string>;
  stock: number;
  relatedProductIds?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  product: Types.ObjectId | IProduct;
  quantity: number;
  price: number;
}

export interface ICart {
  user: Types.ObjectId | IUser;
  items: ICartItem[];
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
  addItem?: (productId: Types.ObjectId, price: number, quantity?: number) => Promise<void>;
  removeItem?: (productId: Types.ObjectId) => Promise<void>;
  updateQuantity?: (productId: Types.ObjectId, quantity: number) => Promise<void>;
  clearCart?: () => Promise<void>;
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface IOrderItem {
  product: Types.ObjectId | IProduct;
  quantity: number;
  price: number;
  name: string;
  image: string;
}

export interface IOrder {
  user: Types.ObjectId | IUser;
  items: IOrderItem[];
  total: number;
  subtotal: number;
  shipping: number;
  vat: number;
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
  };
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
  token: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}