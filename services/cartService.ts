import { api } from './api';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    category: string;
  };
  quantity: number;
  price: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
  total: number;
}

export const cartService = {
  // Get user's cart
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/cart');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch cart');
    }
    
    return response.data;
  },

  // Add item to cart
  addToCart: async (productId: string, quantity: number = 1): Promise<Cart> => {
    const response = await api.post('/cart', {
      productId,
      quantity,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to add to cart');
    }
    
    return response.data;
  },

  // Update item quantity
  updateQuantity: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await api.put(`/cart/${productId}`, {
      quantity,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update cart');
    }
    
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (productId: string): Promise<Cart> => {
    const response = await api.delete(`/cart/${productId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to remove from cart');
    }
    
    return response.data;
  },

  // Clear cart
  clearCart: async (): Promise<Cart> => {
    const response = await api.delete('/cart');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to clear cart');
    }
    
    return response.data;
  },

  // Merge guest cart with user cart
  mergeCart: async (items: { productId: string; quantity: number }[]): Promise<Cart> => {
    const response = await api.post('/cart/merge', { items });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to merge cart');
    }
    
    return response.data;
  },
};

export default cartService;
