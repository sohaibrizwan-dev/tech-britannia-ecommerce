import { api } from './api';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmation {
  success: boolean;
  paymentIntentId: string;
  status: 'succeeded' | 'processing' | 'requires_action' | 'failed';
  orderId: string;
}

export const paymentService = {
  /**
   * Create a payment intent for an order
   */
  createPaymentIntent: async (orderId: string): Promise<PaymentIntentResponse> => {
    const response = await api.post('/payments/create-intent', { orderId });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create payment intent');
    }
    
    return response.data;
  },

  /**
   * Confirm payment completion
   */
  confirmPayment: async (orderId: string, paymentIntentId: string): Promise<PaymentConfirmation> => {
    const response = await api.post(`/payments/confirm/${orderId}`, { paymentIntentId });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to confirm payment');
    }
    
    return response.data;
  },

  /**
   * Get payment status for an order
   */
  getPaymentStatus: async (orderId: string): Promise<string> => {
    const response = await api.get(`/payments/status/${orderId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get payment status');
    }
    
    return response.data.status;
  },

  /**
   * Process a simulated payment (for demo without Stripe keys)
   * This creates the order and marks it as paid
   */
  processSimulatedPayment: async (orderData: {
    shippingAddress: {
      fullName: string;
      email: string;
      address: string;
      city: string;
      postcode: string;
    };
  }): Promise<{ orderId: string; orderNumber: string }> => {
    // First create the order
    const orderResponse = await api.post('/orders', orderData);
    
    if (!orderResponse.success) {
      throw new Error(orderResponse.message || 'Failed to create order');
    }
    
    const order = orderResponse.data;
    
    // Mark payment as completed (simulated)
    const paymentResponse = await api.put(`/orders/${order._id}/payment`, {
      paymentStatus: 'completed',
      stripePaymentIntentId: `sim_${Date.now()}`,
    });
    
    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message || 'Failed to process payment');
    }
    
    return {
      orderId: order._id,
      orderNumber: order.orderNumber || `TB-${order._id.slice(-6).toUpperCase()}`,
    };
  },
};

export default paymentService;
