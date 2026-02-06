import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe - only create the promise once
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface StripeProviderProps {
  children: React.ReactNode;
}

/**
 * Stripe Elements Provider
 * Wraps the application to provide Stripe context for payment components.
 * 
 * Note: If no publishable key is configured, children render without Stripe context
 * and the checkout will fall back to simulated payments.
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // If no Stripe key configured, render children without Stripe context
  if (!stripePromise) {
    console.warn('Stripe publishable key not configured. Payments will be simulated.');
    return <>{children}</>;
  }

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#1e3a8a', // uk-blue
            colorBackground: '#ffffff',
            colorText: '#1e293b',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
            },
            '.Input:focus': {
              border: '1px solid #1e3a8a',
              boxShadow: '0 0 0 2px rgba(30, 58, 138, 0.2)',
            },
            '.Label': {
              fontWeight: '600',
              marginBottom: '4px',
            },
          },
        },
      }}
    >
      {children}
    </Elements>
  );
};

/**
 * Hook to check if Stripe is available
 */
export const useStripeAvailable = (): boolean => {
  return !!stripePublishableKey;
};

export default StripeProvider;
