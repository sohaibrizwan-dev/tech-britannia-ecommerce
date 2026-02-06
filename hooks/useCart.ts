import { useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';

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

interface UseCartReturn {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => void;
  itemCount: number;
}

export const useCart = (): UseCartReturn => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch cart';
      setError(message);
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setError(null);
      const updatedCart = await cartService.addToCart(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(message);
      throw err;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      setError(null);
      const updatedCart = await cartService.updateQuantity(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update cart';
      setError(message);
      throw err;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      setError(null);
      const updatedCart = await cartService.removeFromCart(productId);
      setCart(updatedCart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove from cart';
      setError(message);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const updatedCart = await cartService.clearCart();
      setCart(updatedCart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(message);
      throw err;
    }
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refetch: fetchCart,
    itemCount,
  };
};
