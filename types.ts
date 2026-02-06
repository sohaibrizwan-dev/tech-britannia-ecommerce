import React from 'react';

// Base interface with MongoDB _id support
interface BaseEntity {
  _id?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Review {
  id: string | number;
  name: string;
  location?: string;
  text: string;
  rating: number;
}

export interface Product extends BaseEntity {
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number; // For sale items
  rating: number;
  reviews: number;
  image: string;
  images?: string[]; // Multiple images for gallery
  isRecentlyAdded?: boolean;
  specs: string[]; // Quick specs (used in card)
  description?: string; // Full description
  technicalSpecs?: Record<string, string>; // Detailed Key-Value specs
  stock: number;
  relatedProductIds?: string[]; // IDs for cross-selling (e.g. phone -> case)
}

export interface CartItem extends BaseEntity {
  product: Product | string;
  quantity: number;
  price: number;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem extends BaseEntity {
  product: Product | string;
  quantity: number;
  price: number;
  name: string;
  image: string;
}

export interface Order extends BaseEntity {
  user?: string | User;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  shipping?: number;
  vat?: number;
  status: OrderStatus;
  shippingAddress?: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
  };
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  orderNumber?: string;
  date?: string; // For backward compatibility
}

export interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  dark?: boolean;
}

// Helper function to get ID from entity (handles both id and _id)
export const getId = (entity: BaseEntity): string => {
  return entity.id || entity._id || '';
};
