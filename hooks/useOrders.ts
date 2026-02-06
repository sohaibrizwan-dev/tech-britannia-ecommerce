import { useState, useEffect } from 'react';
import { Order } from '../types';
import { orderService } from '../services/orderService';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  refetch: () => void;
}

export const useOrders = (page: number = 1, limit: number = 10): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await orderService.getMyOrders(page, limit);
        setOrders(response.data);
        setPagination(response.pagination);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch orders';
        setError(message);
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await orderService.getMyOrders(page, limit);
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    error,
    pagination,
    refetch,
  };
};

export const useOrder = (orderId: string | undefined) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await orderService.getOrder(orderId);
        setOrder(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch order';
        setError(message);
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, error };
};
