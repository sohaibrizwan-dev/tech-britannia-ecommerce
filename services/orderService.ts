import { Order, OrderStatus } from '../types';
import { api } from './api';

interface CreateOrderData {
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
  };
  items?: {
    productId: string;
    quantity: number;
  }[];
}

interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const orderService = {
  // Create order from cart
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const response = await api.post('/orders', orderData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create order');
    }
    
    return response.data;
  },

  // Get user's orders
  getMyOrders: async (page: number = 1, limit: number = 10): Promise<OrdersResponse> => {
    const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch orders');
    }
    
    return response;
  },

  // Get single order
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order');
    }
    
    return response.data;
  },

  // Admin: Get all orders
  getAllOrders: async (
    page: number = 1, 
    limit: number = 20, 
    status?: OrderStatus
  ): Promise<OrdersResponse> => {
    let url = `/orders?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    
    const response = await api.get(url);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch orders');
    }
    
    return response;
  },

  // Admin: Update order status
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update order status');
    }
    
    return response.data;
  },

  // Admin: Get order statistics
  getOrderStats: async (): Promise<any> => {
    const response = await api.get('/orders/stats/overview');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order statistics');
    }
    
    return response.data;
  },
};

export default orderService;
