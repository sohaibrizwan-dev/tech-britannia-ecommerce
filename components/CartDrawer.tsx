import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatGBP } from '../services/formatters';

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, isDrawerOpen, setIsDrawerOpen } = useCart();

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                <ShoppingBag className="text-uk-blue" /> Your Cart ({cart.length})
              </h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                    <ShoppingBag size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your cart is empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Looks like you haven't added anything yet.</p>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-6 py-3 bg-uk-blue text-white rounded-lg font-bold hover:bg-blue-900 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                            <button 
                              onClick={() => updateQuantity(item.id || '', Math.max(0, item.quantity - 1))}
                              className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id || '', item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-bold text-uk-blue dark:text-blue-400">
                            {formatGBP(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{formatGBP(cartTotal)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
                  Shipping and taxes calculated at checkout.
                </p>
                <div className="grid gap-3">
                  <Link 
                    to="/checkout"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-4 bg-uk-blue text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
                  >
                    Checkout Now <ArrowRight size={18} />
                  </Link>
                  <Link 
                    to="/cart"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
