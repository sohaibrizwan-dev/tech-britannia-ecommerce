import { api } from './api';
import { Category, Review } from '../types';

const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800';

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'laptops': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=800',
  'laptops-macbooks': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=800',
  'smartphones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
  'phones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
  'audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
  'headphones-audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
  'gaming': 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=800',
  'cameras': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
  'cameras-drones': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
  'wearables': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
  'smart-wearables': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
  'smart-home': 'https://images.unsplash.com/photo-1558002038-1091a1661116?auto=format&fit=crop&q=80&w=800',
  'home': 'https://images.unsplash.com/photo-1558002038-1091a1661116?auto=format&fit=crop&q=80&w=800',
  'accessories': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&q=80&w=800',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeCategory = (input: any): Category => {
  if (typeof input === 'string') {
    const name = input.trim();
    const key = slugify(name);
    return {
      id: key || name,
      name,
      image: CATEGORY_IMAGE_MAP[key] || DEFAULT_CATEGORY_IMAGE,
    };
  }

  const name = String(input?.name || input?.title || input?.label || '').trim();
  const key = slugify(name || String(input?.id || ''));
  return {
    id: String(input?.id || key || name || 'category'),
    name: name || String(input?.id || 'Category'),
    image: input?.image || CATEGORY_IMAGE_MAP[key] || DEFAULT_CATEGORY_IMAGE,
  };
};

const normalizeCategories = (data: any): Category[] => {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeCategory);
};

export const storefrontApi = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/products/categories');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    return normalizeCategories(response.data);
  },

  getReviews: async (): Promise<Review[]> => {
    const response = await api.get('/reviews');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch reviews');
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  getFeaturedReviews: async (): Promise<any[]> => {
    const response = await api.get('/reviews/featured');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch featured reviews');
    }
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default storefrontApi;
