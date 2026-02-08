import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CheckCircle, Truck, CreditCard, Lock, MapPin, 
  ShieldCheck, AlertCircle, ShoppingBag, LogIn, Loader2
} from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CartItem, Product } from '../types';
import { formatGBP, calculateVAT } from '../services/formatters';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Validation Schema - shipping only
const shippingSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  email: z.string().email("Valid email required"),
  address: z.string().min(5, "Address line 1 is required"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(5, "Valid UK Postcode required"),
  terms: z.boolean().refine(val => val === true, "You must accept the terms"),
});

type ShippingFormInputs = z.infer<typeof shippingSchema>;

interface CheckoutPageProps {
  cart: CartItem[];
  clearCart: () => void;
}

// Order confirmation data type
interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  email: string;
  total: number;
}

// Stripe CardElement styling to match our design
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#94a3b8',
      },
      iconColor: '#1e3a8a',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true, // We collect postcode in shipping form
};

// Check if Stripe is configured
const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, clearCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  // Stripe hooks - will be null if Stripe is not configured
  const stripe = useStripe();
  const elements = useElements();
  
  const [step, setStep] = useState<'details' | 'processing' | 'confirm'>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const subtotal = cart.reduce((acc, item) => {
    const price = typeof item.price === 'number' ? item.price : 0;
    const product = item.product as Product;
    const itemPrice = price || product?.price || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);
  const vat = calculateVAT(subtotal);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
  } = useForm<ShippingFormInputs>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      email: user?.email || '',
      fullName: user?.name || '',
    }
  });

  // Pre-fill form with user data when authenticated
  useEffect(() => {
    if (user) {
      setValue('email', user.email);
      setValue('fullName', user.name);
    }
  }, [user, setValue]);

  // Handle card element changes
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const onSubmit = async (data: ShippingFormInputs) => {
    setError(null);
    
    // Check if card is complete (for Stripe mode)
    if (isStripeConfigured && !cardComplete) {
      setCardError('Please enter your card details');
      return;
    }
    
    setIsProcessing(true);
    setStep('processing');
    
    try {
      // Prepare items for backend
      const items = cart.map((item) => ({
        productId: (item.id || (item as any)._id || ((item.product as any)?._id as string)) as string,
        quantity: item.quantity,
      })).filter((i) => !!i.productId && i.quantity > 0);

      if (items.length === 0) {
        setError('Your basket is empty or items are invalid. Please add products again.');
        setStep('details');
        setIsProcessing(false);
        return;
      }

      const shippingAddress = {
        fullName: data.fullName,
        email: data.email,
        address: data.address,
        city: data.city,
        postcode: data.postcode,
      };

      // If Stripe is configured, use real payment processing
      if (isStripeConfigured && stripe && elements) {
        // Step 1: Create payment intent on backend
        const intentResponse = await api.post('/payments/create-intent', {
          shippingAddress,
          items,
        });

        if (!intentResponse.success) {
          throw new Error(intentResponse.message || 'Failed to create payment intent');
        }

        const { clientSecret, orderId } = intentResponse.data;

        // Step 2: Confirm the payment with Stripe
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement as any,
            billing_details: {
              name: data.fullName,
              email: data.email,
              address: {
                line1: data.address,
                city: data.city,
                postal_code: data.postcode,
                country: 'GB',
              },
            },
          },
        });

        if (stripeError) {
          // Show user-friendly error messages
          let errorMessage = stripeError.message || 'Payment failed';
          
          // Map common Stripe error codes to user-friendly messages
          if (stripeError.code === 'card_declined') {
            errorMessage = 'Your card was declined. Please try a different card.';
          } else if (stripeError.code === 'insufficient_funds') {
            errorMessage = 'Insufficient funds. Please try a different card.';
          } else if (stripeError.code === 'expired_card') {
            errorMessage = 'Your card has expired. Please use a different card.';
          } else if (stripeError.code === 'incorrect_cvc') {
            errorMessage = 'Incorrect CVC. Please check your card details.';
          } else if (stripeError.code === 'processing_error') {
            errorMessage = 'An error occurred while processing your card. Please try again.';
          }

          throw new Error(errorMessage);
        }

        if (paymentIntent?.status === 'succeeded') {
          // Step 3: Confirm payment on backend
          const confirmResponse = await api.post(`/payments/confirm/${orderId}`, {
            paymentIntentId: paymentIntent.id,
          });

          if (!confirmResponse.success) {
            throw new Error('Payment confirmed but order update failed. Please contact support.');
          }

          setOrderConfirmation({
            orderId: orderId,
            orderNumber: confirmResponse.data.orderNumber || `TB-${orderId.slice(-6).toUpperCase()}`,
            email: data.email,
            total: total,
          });
          
          clearCart();
          setStep('confirm');
        } else {
          throw new Error('Payment was not completed. Please try again.');
        }
      } else {
        // Fallback: Simulated payment (when Stripe is not configured)
        console.warn('Stripe not configured - using simulated payment');
        
        // Create order through API
        const orderResponse = await api.post('/orders', {
          shippingAddress,
          items,
        });

        if (!orderResponse.success) {
          throw new Error(orderResponse.message || 'Failed to create order');
        }

        const order = orderResponse.data;
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mark payment as completed (simulated)
        await api.put(`/orders/${order._id}/payment`, {
          paymentStatus: 'completed',
          stripePaymentIntentId: `sim_${Date.now()}`,
        });

        setOrderConfirmation({
          orderId: order._id || order.id || '',
          orderNumber: order.orderNumber || `TB-${(order._id || order.id || '').slice(-6).toUpperCase()}`,
          email: data.email,
          total: order.total || total,
        });
        
        clearCart();
        setStep('confirm');
      }
      
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to process order. Please try again.');
      setStep('details');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-uk-blue" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Require authentication for checkout
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700"
        >
          <div className="w-16 h-16 bg-uk-blue/10 text-uk-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sign In Required</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Please sign in or create an account to complete your purchase. Your cart items will be saved.
          </p>
          <div className="space-y-3">
            <Link 
              to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
              className="block w-full py-4 bg-uk-blue text-white font-bold rounded-lg hover:bg-blue-900 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to={`/signup?redirect=${encodeURIComponent(location.pathname)}`}
              className="block w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Create Account
            </Link>
          </div>
          <Link to="/cart" className="inline-block mt-6 text-uk-blue dark:text-blue-400 hover:underline text-sm">
            ← Return to Cart
          </Link>
        </motion.div>
      </div>
    );
  }

  // Empty cart check
  if (cart.length === 0 && step === 'details') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h2 className="text-2xl font-bold dark:text-white mb-2">Your basket is empty</h2>
          <Link to="/shop" className="text-uk-blue dark:text-blue-400 font-bold hover:underline">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-slate-200 dark:border-slate-700 rounded-full mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-uk-blue border-t-transparent rounded-full mx-auto animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Processing Payment</h2>
          <p className="text-slate-600 dark:text-slate-400">Please wait while we secure your order...</p>
        </motion.div>
      </div>
    );
  }

  // Order confirmation
  if (step === 'confirm' && orderConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-100 dark:border-slate-700"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Order Confirmed!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Thank you for your order. A confirmation email including your VAT invoice has been sent to <strong>{orderConfirmation.email}</strong>.
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-8 border border-slate-100 dark:border-slate-600">
             <p className="font-bold dark:text-white">Order Reference: {orderConfirmation.orderNumber}</p>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Est. Delivery: Tomorrow</p>
             <p className="text-lg font-bold text-uk-blue dark:text-blue-400 mt-2">Total: {formatGBP(orderConfirmation.total)}</p>
          </div>
          <div className="space-y-3">
            <Link 
              to="/account" 
              className="block w-full py-4 bg-uk-blue text-white font-bold rounded-lg hover:bg-blue-900 transition-colors"
            >
              View Order History
            </Link>
            <Link 
              to="/shop" 
              className="block w-full py-3 text-uk-blue dark:text-blue-400 font-bold hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Checkout form
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/cart" className="hover:text-uk-blue">Cart</Link>
          <span>/</span>
          <span className="font-bold text-slate-900 dark:text-white">Checkout</span>
        </div>

        {/* Logged in user badge */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Signed in as <strong className="text-slate-900 dark:text-white">{user?.email}</strong>
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-8 dark:text-white">Secure Checkout</h1>

        {/* Stripe mode indicator */}
        {!isStripeConfigured && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm">
              <strong>Demo Mode:</strong> Stripe is not configured. Payments are simulated. 
              Add your Stripe key to enable real payments.
            </p>
          </div>
        )}

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Address */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 dark:text-white">
                <span className="w-8 h-8 rounded-full bg-uk-blue text-white flex items-center justify-center text-sm">1</span>
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">Full Name</label>
                  <input {...register('fullName')} type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-uk-blue" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">Email Address</label>
                  <input {...register('email')} type="email" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-uk-blue" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">Address Line 1</label>
                  <input {...register('address')} type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-uk-blue" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">City</label>
                  <input {...register('city')} type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-uk-blue" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">Postcode</label>
                  <input {...register('postcode')} type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-uk-blue" />
                  {errors.postcode && <p className="text-red-500 text-xs mt-1">{errors.postcode.message}</p>}
                </div>
              </div>
            </section>

            {/* Section 2: Delivery */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 dark:text-white">
                <span className="w-8 h-8 rounded-full bg-uk-blue text-white flex items-center justify-center text-sm">2</span>
                Delivery Method
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-uk-blue bg-blue-50 dark:bg-slate-700/50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-4">
                    <input type="radio" name="delivery" defaultChecked className="w-5 h-5 text-uk-blue" />
                    <div>
                      <span className="block font-bold dark:text-white">Royal Mail Tracked 24</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Next working day delivery</span>
                    </div>
                  </div>
                  <span className="font-bold text-uk-blue dark:text-blue-400">{shipping === 0 ? 'FREE' : formatGBP(shipping)}</span>
                </label>
                <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer opacity-60">
                  <div className="flex items-center gap-4">
                    <input type="radio" name="delivery" disabled className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="block font-bold dark:text-slate-300">Same Day Courier (London Only)</span>
                      <span className="text-sm text-slate-500">Unavailable for your postcode</span>
                    </div>
                  </div>
                  <span className="font-bold dark:text-slate-300">£15.00</span>
                </label>
              </div>
            </section>

            {/* Section 3: Payment */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 dark:text-white">
                <span className="w-8 h-8 rounded-full bg-uk-blue text-white flex items-center justify-center text-sm">3</span>
                Payment Details
              </h2>
              
              {isStripeConfigured ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 dark:text-slate-300">
                      Card Information
                    </label>
                    <div className={`p-4 rounded-lg border ${cardError ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'} bg-white dark:bg-slate-900`}>
                      <CardElement
                        options={cardElementOptions}
                        onChange={handleCardChange}
                      />
                    </div>
                    {cardError && (
                      <p className="text-red-500 text-xs mt-1">{cardError}</p>
                    )}
                  </div>
                  
                  {/* Security Notice */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-4">
                    <Lock size={12} />
                    <span>Your payment is secured by Stripe. We never store your card details.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Simulated card input for demo mode */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <CreditCard size={24} />
                      <div>
                        <p className="font-medium">Demo Payment Mode</p>
                        <p className="text-sm">Card details are not required. Click "Pay" to simulate a successful payment.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-24">
              <h3 className="font-bold text-lg mb-6 dark:text-white">Order Summary</h3>
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, index) => {
                  const product = item.product as Product;
                  const itemPrice = typeof item.price === 'number' ? item.price : product?.price || 0;
                  const itemImage = item.image || product?.image || '';
                  const itemName = item.name || product?.name || 'Product';
                  
                  return (
                    <div key={item.id || item._id || index} className="flex gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0 overflow-hidden">
                        <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-bold dark:text-white line-clamp-1">{itemName}</p>
                        <p className="text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-sm dark:text-white">{formatGBP(itemPrice * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatGBP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatGBP(shipping)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-500 text-xs">
                  <span>VAT (20%)</span>
                  <span>{formatGBP(vat)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white pt-4 border-t border-slate-100 dark:border-slate-700">
                  <span>Total</span>
                  <span>{formatGBP(total)}</span>
                </div>
              </div>

              {/* Terms */}
              <div className="mt-6">
                 <label className="flex items-start gap-2 cursor-pointer">
                   <input {...register('terms')} type="checkbox" className="mt-1 w-4 h-4 rounded text-uk-blue focus:ring-uk-blue" />
                   <span className="text-xs text-slate-600 dark:text-slate-400">
                     I accept the <a href="#" className="underline">Terms & Conditions</a> and <a href="#" className="underline">Privacy Policy</a>.
                   </span>
                 </label>
                 {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms.message}</p>}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isProcessing || (isStripeConfigured && (!stripe || !elements))}
                className="w-full mt-6 py-4 bg-uk-blue text-white font-bold rounded-lg hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Pay {formatGBP(total)}
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-slate-400 mt-4">
                <Lock size={10} className="inline mr-1" />
                Payments are processed securely. No card data is stored on our servers.
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};